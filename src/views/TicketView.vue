<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'vue-sonner';
import MenuLayout from '@/components/Menu/MenuLayout.vue';
import {type CreateTicket, type ReserveTicket, type Ticket, type User, type Vehicle} from '@/types';
import {ticketService} from '@/services/ticket.service';
import {Skeleton} from "@/components/ui/skeleton";
import EmptyMessage from '@/components/EmptyMessage.vue';
import FloatingButton from '@/components/FloatingButton.vue';
import {useState} from '@/composables/state';
import Title from '@/components/Title.vue';
import {useAuth} from '@/composables/auth';
import {userService} from '@/services/user.service';
import {vehicleService} from '@/services/vehicle.service';
import debounce from 'lodash.debounce';
import { Trash2, X, Save, CalendarDays, Pencil } from 'lucide-vue-next';

const { isLoading, isMutated, page, limit, maxPage, dialogs, openDialog, closeDialog, selectedItem, itemList } = useState<Ticket>({ limit: 20 });
const isEditing = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);

const isRegistering = ref(false);
const registerTicketPayload = ref<ReserveTicket>({
  sectionId: 0,
  slot: 0,
})

const isUserDropdownVisible = ref(false);
const user = ref<User | null>(null);
const users = ref<User[]>([]);
const userInput = ref<string | undefined>(undefined);

const isVehicleDropdownVisible = ref(false);
const vehicles = ref<Vehicle[]>([]);
const vehicleInput = ref<string | undefined>(undefined);
const vehicle = ref<Vehicle | null>(null);

const showDeleteAlert = ref(false);
const ticketToDelete = ref<number | null>(null);

const isPrivilledged = computed(() => {
  const { role } = useAuth();
  return role.value === 'ADMIN' || role.value === 'SECURITY';
});

const isAdmin = computed(() => {
  const { role } = useAuth();
  return role.value === 'ADMIN';
});

const createTicketPayload = ref<CreateTicket>({
  type: 'DAILY',
  userId: undefined,
  vehicleId: undefined,
  sectionId: undefined,
  slot: undefined,
})

const getAllTickets = async () => {
  isLoading.value = true;
  try {
    const response = await ticketService.getAll(page.value, limit.value, { cache: !isMutated.value });
    itemList.value = response.data;
    maxPage.value = response.maxPage;
    isMutated.value = false;
  } catch (error) {
    toast.error('Error', error ? { description: error || 'Failed to load tickets' } : { description: 'An unexpected error occurred' });
  } finally {
    isLoading.value = false;
  }
};

const getTicketDetail = async (id: number) => {
  selectedItem.value = null;
  openDialog("view");
  try {
    selectedItem.value = await ticketService.getById(id);
    if (selectedItem.value.userId) user.value = await userService.getById(selectedItem.value.userId)
    if (selectedItem.value.vehicleId) vehicle.value = await vehicleService.getById(selectedItem.value.vehicleId)
  } catch (error) {
    toast.error('Error', error ? { description: error || 'Failed to load ticket details' } : { description: 'An unexpected error occurred' });
    closeDialog("view");
  }
};

const createTicket = async () => {
  try {
    createTicketPayload.value.userId = user.value?.id;
    await ticketService.create(createTicketPayload.value)
    toast.success('Success', { description: 'Ticket created successfully' });
  } catch (error) {
    toast.error('Error', error ? { description: error || 'Failed to load tickets' } : { description: 'An unexpected error occurred' });
  } finally {
    closeDialog("create");
    user.value = null;
    userInput.value = undefined;
    users.value = [];
    await getAllTickets();
  }
}

const updateTicket = async () => {
  if (!selectedItem.value) return;
  try {
    await ticketService.update(selectedItem.value.id, {
      type: selectedItem.value.type,
      status: selectedItem.value.status,
    })
    toast.success('Success', { description: 'Ticket updated successfully' });
  } catch (error) {
    toast.error('Error', error ? { description: error || 'Failed to load tickets' } : { description: 'An unexpected error occurred' });
  } finally {
    isEditing.value = false;
    closeDialog("view");
    await getAllTickets();
  }
}

const confirmDeleteTicket = (id: number | undefined) => {
  if (!id) return;
  ticketToDelete.value = id;
  showDeleteAlert.value = true;
};

const deleteTicket = async () => {
  if (!ticketToDelete.value) return;
  try {
    await ticketService.delete(ticketToDelete.value);
    isMutated.value = true;
    toast.success('Success', { description: 'Ticket deleted successfully' });
  } catch (error) {
    toast.error('Error', error ? { description: error || 'Failed to load tickets' } : { description: 'An unexpected error occurred' });
  } finally {
    showDeleteAlert.value = false;
    ticketToDelete.value = null;
    closeDialog("view");
    await getAllTickets();
  }
};

const cancelTicketSubscription = async () => {
  if (!selectedItem.value) return;
  try {
    await ticketService.unsubscribe(selectedItem.value.id);
    toast.success('Success', { description: 'Subscription cancelled successfully' });
  } catch (error) {
    toast.error('Error', { description: 'Failed to cancel subscription' });
  } finally {
    closeDialog("view");
    await getAllTickets();
  }
}

const registerTicket = async () => {
  if (!selectedItem.value || registerTicketPayload.value.sectionId == 0 || registerTicketPayload.value.slot == 0) return;
  try {
    await ticketService.subcribe(selectedItem.value.id, {
      sectionId: registerTicketPayload.value.sectionId,
      slot: registerTicketPayload.value.slot,
    })
    toast.success('Success', { description: 'Ticket registered successfully' });
  } catch (error) {
    toast.error('Error', error ? { description: error || 'Failed to load tickets' } : { description: 'An unexpected error occurred' });
  } finally {
    isEditing.value = false;
    closeDialog("view");
    await getAllTickets();
  }
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'DAILY': return 'Daily Pass';
    case 'MONTHLY': return 'Monthly Subscription';
    case 'RESERVED': return 'Reserved Spot';
    default: return type;
  }
};

const getStatusBadgeClasses = (status: string) => {
  const base = 'text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap inline-block';
  switch (status) {
    case 'AVAILABLE': return `${base} !bg-green-100 !text-green-700 dark:!bg-green-900/50 dark:!text-green-300`;
    case 'INUSE': return `${base} !bg-blue-100 !text-blue-700 dark:!bg-blue-900/50 dark:!text-blue-300`;
    case 'LOST': return `${base} !bg-red-100 !text-red-700 dark:!bg-red-900/50 dark:!text-red-300`;
    default: return `${base} !bg-gray-100 !text-gray-700 dark:!bg-gray-700/50 dark:!text-gray-300`;
  }
};

const getStatusTextClasses = (status: string) => {
  switch (status) {
    case 'AVAILABLE': return 'font-medium text-green-600 dark:text-green-400';
    case 'INUSE': return 'font-medium text-blue-600 dark:text-blue-400';
    case 'LOST': return 'font-medium text-red-600 dark:text-red-400';
    default: return 'font-medium text-gray-600 dark:text-gray-400';
  }
};

const handleScroll = () => {
  if (!isLoading.value && page.value < maxPage.value) {
    console.log("Reached bottom, loading more...");
    page.value += 1;
    isLoading.value = true;

    ticketService.getAll(page.value, limit.value, { cache: !isMutated.value })
        .then((response) => {
          if (response.data && response.data.length > 0) {
            itemList.value.push(...response.data);
          }
          maxPage.value = response.maxPage;
        })
        .catch(() => {
          toast.error('Error', { description: 'Failed to load more tickets' });
        })
        .finally(() => {
          isLoading.value = false;
        });
  }
};

const selectUser = (selectedUser: User) => {
  user.value = selectedUser;
  userInput.value = selectedUser.name;
  isUserDropdownVisible.value = false;
}

const closeUserDropdown = (event: MouseEvent) => {
  const userDropdown = document.getElementById('user-dropdown');
  const userInput = document.getElementById('user-input');

  if (userDropdown &&
      !userDropdown.contains(event.target as Node) &&
      !userInput?.contains(event.target as Node)) {
    isUserDropdownVisible.value = false;
  }
}

const selectVehicle = (selectedVehicle: Vehicle) => {
  vehicle.value = selectedVehicle;
  vehicleInput.value = selectedVehicle.plate;
  createTicketPayload.value.vehicleId = selectedVehicle.id;
  isVehicleDropdownVisible.value = false;
}

const closeVehicleDropdown = (event: MouseEvent) => {
  const vehicleDropdown = document.getElementById('vehicle-dropdown');
  const vehicleInputEl = document.getElementById('vehicle-input');

  if (vehicleDropdown &&
      !vehicleDropdown.contains(event.target as Node) &&
      !vehicleInputEl?.contains(event.target as Node)) {
    isVehicleDropdownVisible.value = false;
  }
}

const debouncedVehicleSearch = debounce(async (value: string) => {
  if (vehicle.value && (value !== vehicle.value.plate)) {
    vehicle.value = null;
    createTicketPayload.value.vehicleId = undefined;
  }

  if (value) {
    try {
      vehicles.value = await vehicleService.search(value);
      isVehicleDropdownVisible.value = vehicles.value.length > 0;
    } catch (error) {
      toast.error('Error', { description: 'Failed to load vehicles' });
    }
  } else {
    isVehicleDropdownVisible.value = false;
    vehicles.value = [];
  }
}, 2000);

const debouncedUserSearch = debounce(async (value: string | null) => {
  if (user.value && (value !== user.value.name)) {
    user.value = null;
    createTicketPayload.value.userId = undefined;
  }

  let params: { email?: string, name?: string } = {};
  if (value) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      params.email = value;
    } else {
      params.name = value;
    }
    try {
      users.value = await userService.search(params);
      isUserDropdownVisible.value = users.value.length > 0;
    } catch (error) {
      toast.error('Error', { description: 'Failed to load users' });
    }
  } else {
    isUserDropdownVisible.value = false;
    users.value = [];
  }
}, 2000);

onMounted(() => {
  getAllTickets();
  scrollContainer.value?.addEventListener('scroll', handleScroll);
  document.addEventListener('click', closeUserDropdown);
  document.addEventListener('click', closeVehicleDropdown);
});

onBeforeUnmount(() => {
  scrollContainer.value?.removeEventListener('scroll', handleScroll);
  document.removeEventListener('click', closeUserDropdown);
  document.removeEventListener('click', closeVehicleDropdown);
});

watch(userInput, (newVal) => {
  if (newVal) {
    debouncedUserSearch(newVal);
  } else {
    isUserDropdownVisible.value = false;
    users.value = [];
  }
});

watch(vehicleInput, (newVal) => {
  if (newVal) {
    debouncedVehicleSearch(newVal);
  } else {
    isVehicleDropdownVisible.value = false;
    vehicles.value = [];
  }
});

const closeCreateDialog = () => {
  closeDialog("create");
  users.value = [];
  user.value = null;
  userInput.value = undefined;
  vehicles.value = [];
  vehicleInput.value = undefined;
}
</script>

<template>
  <MenuLayout>
    <div ref="scrollContainer"
         class="min-h-screen !bg-gray-50 dark:!bg-gray-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div class="max-w-7xl mx-auto">
        <Title name="Tickets" subtext="View and manage parking tickets" @click="getAllTickets" class="mb-6 md:mb-8" />

        <!-- Skeleton Loading -->
        <Skeleton v-if="isLoading" type="grid-card" :count="limit" />

        <!-- Tickets Grid -->
        <div v-else-if="itemList.length > 0"
             class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">

          <!-- === Ticket Card Start === -->
          <div v-for="ticket in itemList" :key="ticket.id" class="
              ticket-card  relative
              !bg-white dark:!bg-gray-800
              rounded-lg shadow-sm hover:shadow-lg
              border border-gray-200 dark:border-gray-700
              flex flex-col overflow-hidden
              transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer
            " @click="getTicketDetail(ticket.id)" role="button">
            <!-- Main Ticket Body -->
            <div class="p-5 flex-grow">
              <div class="flex justify-between items-start mb-3 gap-2">
                <span :class="getStatusBadgeClasses(ticket.status)">
                  {{ ticket.status }}
                </span>
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {{ getTypeLabel(ticket.type) }}
              </div>
            </div>
            <!-- Perforation Line & Stub -->
            <div class="
                  ticket-stub
                  border-t-2 border-dashed border-gray-300 dark:border-gray-600
                  mt-auto
                  bg-gray-50 dark:bg-gray-700/50
                  px-5 py-3
                ">
              <div class="text-xs text-gray-500 dark:text-gray-400 text-center font-mono tracking-wider">
                TICKET ID: {{ ticket.id }}
              </div>
            </div>
          </div>
          <!-- === Ticket Card End === -->
        </div>

        <!-- Empty State -->
        <EmptyMessage v-else message="No tickets found matching your criteria." @refresh="getAllTickets"
                      class="mt-10" />

        <!-- Ticket Detail Dialog -->
        <Dialog :open="dialogs.view" @update:open="(open) => !open && closeDialog('view')">
          <DialogContent class="max-w-[550px] w-[95%]">
            <DialogHeader>
              <DialogTitle>Ticket Details</DialogTitle>
            </DialogHeader>
            <div v-if="selectedItem" class="p-2">
              <div class="grid grid-cols-3 gap-x-4 gap-y-4">
                <!-- ID -->
                <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">ID</span>
                <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ selectedItem.id }}</span>
                <!-- Type -->
                <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Type</span>
                <span v-if="!isEditing" class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{
                    getTypeLabel(selectedItem.type) }}</span>
                <Select v-else-if="isEditing && selectedItem" v-model="selectedItem.type">
                  <SelectTrigger class="col-span-2">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="type in ['DAILY', 'MONTHLY', 'RESERVED']" :key="type" :value="type">
                      {{ getTypeLabel(type) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <!-- Status -->
                <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
                <span v-if="!isEditing" :class="getStatusTextClasses(selectedItem.status)" class="col-span-2 text-sm">{{
                    selectedItem.status
                  }}</span>
                <Select v-else-if="isEditing && selectedItem" v-model="selectedItem.status">
                  <SelectTrigger class="col-span-2">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="status in ['AVAILABLE', 'INUSE', 'LOST', 'CANCELED']" :key="status" :value="status">
                      {{ status }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <!-- Vehicle -->
                <template v-if="vehicle">
                  <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle</span>
                  <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ vehicle.plate }}
                    ({{ vehicle.type.toLowerCase() }})</span>
                </template>
                <!-- User -->
                <template v-if="user">
                  <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">User</span>
                  <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ user.name }} ({{ user.username
                    }})</span>
                </template>
                <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Created At</span>
                <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ new
                Date(selectedItem.createdAt).toLocaleString()
                  }}</span>
                <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Updated At</span>
                <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ new
                Date(selectedItem.updatedAt).toLocaleString()
                  }}</span>
              </div>
            </div>
            <div v-else class="p-6 text-center text-gray-500 dark:text-gray-400">
              Loading ticket details...
            </div>
            <!-- Footer/Actions -->
            <div class="flex justify-end gap-3 p-4 border-t">
              <Button
                  v-if="(selectedItem?.type == 'MONTHLY' || selectedItem?.type == 'RESERVED') && selectedItem.status != 'CANCELED'"
                  variant="outline" size="sm" @click="cancelTicketSubscription">
                <X class="w-5 h-5 mr-2"/>
                Cancel
              </Button>
              <Button v-else-if="selectedItem?.status == 'CANCELED'" variant="outline" size="sm"
                      @click="isRegistering = true" class="bg-blue-600 hover:bg-blue-700 text-white">
                <CalendarDays class="w-5 h-5 mr-2"/>
                Reserve
              </Button>
              <Button v-if="isPrivilledged && !isEditing" variant="outline" size="sm" @click="isEditing = true" class="bg-blue-600 hover:bg-blue-700 text-white">
                <Pencil class="w-5 h-5 mr-2"/>
                Edit
              </Button>
              <Button v-else-if="isPrivilledged && isEditing" variant="outline" size="sm" @click="updateTicket" class="bg-green-600 hover:bg-green-700 text-white">
                <Save class="w-5 h-5 mr-2"/>
                Save
              </Button>
              <Button v-if="isAdmin" variant="destructive" size="sm" @click="confirmDeleteTicket(selectedItem?.id)">
                <Trash2 class="w-5 h-5 mr-2"/>
                Delete
              </Button>
              <Button variant="ghost" size="sm" @click="() => { closeDialog('view'); isEditing = false; vehicle = null; user = null }">
                <X class="w-5 h-5 mr-2"/>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <!-- Register Dialog -->
        <Dialog :open="isRegistering" @update:open="(open) => !open && (isRegistering = false)">
          <DialogContent class="max-w-[550px] w-[95%]">
            <DialogHeader>
              <DialogTitle>Register Ticket</DialogTitle>
            </DialogHeader>
            <div v-if="selectedItem" class="space-y-4">
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="sectionId" class="text-right">Section ID</Label>
                <Input id="sectionId" v-model.number="registerTicketPayload.sectionId" type="number" class="col-span-3" />
              </div>
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="slot" class="text-right">Slot</Label>
                <Input id="slot" v-model.number="registerTicketPayload.slot" type="number" class="col-span-3" />
              </div>
            </div>
            <div class="flex justify-end gap-3">
              <Button variant="outline" @click="registerTicket" class="bg-green-600 hover:bg-green-700 text-white">
                <Save class="w-5 h-5 mr-2"/>
                Save
              </Button>
              <Button variant="ghost" @click="isRegistering = false">
                <X class="w-5 h-5 mr-2"/>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <!-- Create Ticket Dialog -->
        <Dialog :open="dialogs.create" @update:open="(open) => !open && closeCreateDialog()">
          <DialogContent class="max-w-[550px] w-[95%]">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <div class="space-y-4">
              <!-- Ticket Type -->
              <div class="space-y-2">
                <Label for="ticketType">Ticket Type</Label>
                <Select v-model="createTicketPayload.type">
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="type in ['DAILY', 'MONTHLY', 'RESERVED']" :key="type" :value="type">
                      {{ getTypeLabel(type) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- User with Dropdown -->
              <div v-if="createTicketPayload.type !== 'DAILY'" class="relative space-y-2">
                <Label for="user-input">User</Label>
                <div class="relative">
                  <Input v-model="userInput" id="user-input" placeholder="Enter User name or Email"
                         @focus="isUserDropdownVisible = true" />
                  <!-- Selected User Chip -->
                  <div v-if="user" class="mt-2">
                    <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                      {{ user.name }}
                      <button type="button"
                              class="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              @click="user = null; userInput = ''; createTicketPayload.userId = undefined">
                        <span class="sr-only">Remove user</span>
                        <span aria-hidden="true">&times;</span>
                      </button>
                    </span>
                  </div>
                  <!-- User Dropdown -->
                  <div id="user-dropdown" v-if="isUserDropdownVisible"
                       class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    <div v-if="users.length === 0" class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                      No users found
                    </div>
                    <div v-for="userOption in users" :key="userOption.id"
                         class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-600"
                         @click="selectUser(userOption)">
                      <div class="flex items-center">
                        <span class="font-normal block truncate">{{ userOption.name }}</span>
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {{ userOption.username }} - {{ userOption.email }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Vehicle with Dropdown -->
              <div v-if="createTicketPayload.type !== 'DAILY'" class="relative space-y-2">
                <Label for="vehicle-input">Vehicle</Label>
                <div class="relative">
                  <Input v-model="vehicleInput" id="vehicle-input" placeholder="Enter Vehicle plate"
                         @focus="isVehicleDropdownVisible = true" />
                  <!-- Selected Vehicle Chip -->
                  <div v-if="vehicle" class="mt-2">
                    <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                      {{ vehicle.plate }}
                      <button type="button"
                              class="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              @click="vehicle = null; vehicleInput = ''; createTicketPayload.vehicleId = undefined">
                        <span class="sr-only">Remove vehicle</span>
                        <span aria-hidden="true">&times;</span>
                      </button>
                    </span>
                  </div>
                  <!-- Vehicle Dropdown -->
                  <div id="vehicle-dropdown" v-if="isVehicleDropdownVisible"
                       class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    <div v-if="vehicles.length === 0" class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                      No vehicles found
                    </div>
                    <div v-for="vehicleOption in vehicles" :key="vehicleOption.id"
                         class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-600"
                         @click="selectVehicle(vehicleOption)">
                      <div class="flex items-center">
                        <span class="font-normal block truncate">{{ vehicleOption.plate }}</span>
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {{ vehicleOption.type }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Section Id -->
              <div v-if="createTicketPayload.type === 'RESERVED'" class="space-y-2">
                <Label for="sectionId">Section</Label>
                <Input v-model.number="createTicketPayload.sectionId" id="sectionId" type="number" placeholder="Enter Section ID" />
              </div>

              <!-- Slot -->
              <div v-if="createTicketPayload.type === 'RESERVED'" class="space-y-2">
                <Label for="slot">Slot</Label>
                <Input v-model.number="createTicketPayload.slot" id="slot" type="number" placeholder="Enter Slot Number" />
              </div>
            </div>
            <div class="flex justify-end gap-3">
              <Button variant="outline" @click="createTicket" class="bg-green-600 hover:bg-green-700 text-white">
                <Save class="w-5 h-5 mr-2"/>
                Save
              </Button>
              <Button variant="ghost" @click="closeCreateDialog">
                <X class="w-5 h-5 mr-2"/>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>

    <Dialog :open="showDeleteAlert" @update:open="(open) => !open && (showDeleteAlert = false)">
      <DialogContent class="max-w-[400px] w-[95%]">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <div class="py-4 text-center">
          Are you sure you want to delete this ticket? This action cannot be undone.
        </div>
        <div class="flex justify-end gap-3">
          <Button variant="destructive" @click="deleteTicket">
            <Trash2 class="w-5 h-5 mr-2"/>
            Delete
          </Button>
          <Button variant="ghost" @click="showDeleteAlert = false">
            <X class="w-5 h-5 mr-2"/>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <FloatingButton v-if="isPrivilledged" icon="+" @click="openDialog('create')" aria-label="Add new ticket" />
  </MenuLayout>
</template>
