<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import MenuLayout from '@/components/MenuLayout.vue';
import type { CheckIn as OriginalCheckIn, CheckOut as OriginalCheckOut } from '@/types';
import { parkingService } from '@/services/parking.service';

const props = defineProps({
  sectionId: {
    type: Number,
    required: true,
    validator: (value: number) => value > 0 
  }
});

type CheckInFormState = { ticketId: string; plate: string; type: string };
type CheckOutFormState = { ticketId: string; plate: string };

const toast = useToast();

const checkIn = ref<CheckInFormState>({ ticketId: '', plate: '', type: '' });
const checkOut = ref<CheckOutFormState>({ ticketId: '', plate: '' });

const validateCheckIn = () => {
  const ticketIdNum = Number(checkIn.value.ticketId);

  if (!checkIn.value.ticketId || ticketIdNum <= 0 ||
    !checkIn.value.plate.trim() || !checkIn.value.type.trim()) {
    toast.add({ severity: 'warn', summary: 'Missing Information', detail: 'Ticket ID, License Plate, and Vehicle Type are required and must be valid.', life: 3000 });
    return false;
  }
  return true;
}

const validateCheckOut = () => {
  const ticketIdNum = Number(checkOut.value.ticketId);

  if (!checkOut.value.ticketId || ticketIdNum <= 0 ||
    !checkOut.value.plate.trim()) {
    toast.add({ severity: 'warn', summary: 'Missing Information', detail: 'Ticket ID and License Plate are required and must be valid.', life: 3000 });
    return false;
  }
  return true;
}

const handleCheckIn = async (event: Event) => {
  event.preventDefault();
  if (!validateCheckIn()) return;
  try {
    const payload: OriginalCheckIn = {
      sectionId: props.sectionId,
      ticketId: Number(checkIn.value.ticketId),
      plate: checkIn.value.plate.toUpperCase(),
      type: checkIn.value.type.toUpperCase()
    };
    await parkingService.checkIn(payload);
    toast.add({ severity: 'success', summary: 'Success', detail: `Check-in successful for section ${props.sectionId}.`, life: 4000 });
    checkIn.value = { ticketId: '', plate: '', type: '' };
  } catch (error: any) {
    const detail = error?.message || error || 'Failed to check in due to a server error.';
    toast.add({ severity: 'error', summary: 'Error', detail: detail, life: 4000 });
  }
};

const handleCheckOut = async (event: Event) => {
  event.preventDefault();
  if (!validateCheckOut()) return;
  try {
    const payload: OriginalCheckOut = {
      sectionId: props.sectionId,
      ticketId: Number(checkOut.value.ticketId),
      plate: checkOut.value.plate.toUpperCase()
    };
    const response = await parkingService.checkOut(payload);
    const feeFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(response.fee);
    toast.add({ severity: 'success', summary: 'Success', detail: `Check-out successful for section ${props.sectionId}. Fee: ${feeFormatted}`, life: 8000 });
    checkOut.value = { ticketId: '', plate: '' };
  } catch (error: any) {
    const detail = error?.message || error || 'Failed to check out due to a server error.';
    toast.add({ severity: 'error', summary: 'Error', detail: detail, life: 4000 });
  }
};

const vehicleTypes = ['CAR', 'MOTORBIKE'];

</script>

<template>
  <MenuLayout>
    <div
      class="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div class="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">

        <!-- Check In Card -->
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col overflow-hidden animate-fade-in delay-200">
          <div
            class="flex items-center p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
            <div
              class="mr-3 flex-shrink-0 bg-green-100 dark:bg-green-500/30 text-green-600 dark:text-green-300 rounded-full p-2">
              <i class="pi pi-arrow-down text-lg leading-none"></i>
            </div>
            <h2 class="text-lg font-semibold text-green-700 dark:text-green-300">Vehicle Check In (Section {{ sectionId }})</h2> 
          </div>
          <form class="p-6 sm:p-8 flex-1 flex flex-col" @submit="handleCheckIn">
            <div class="space-y-5 flex-1">
              <!-- Ticket ID -->
              <div>
                <label for="checkin-ticket"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ticket ID</label>
                <div class="relative rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i class="pi pi-ticket text-gray-400 dark:text-gray-500"></i>
                  </div>
                  <input type="number" id="checkin-ticket" v-model="checkIn.ticketId" placeholder="Enter ticket ID"
                    required min="1"
                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm pl-10 pr-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
                </div>
              </div>
              <!-- License Plate -->
              <div>
                <label for="checkin-plate"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License Plate</label>
                <div class="relative rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i class="pi pi-car text-gray-400 dark:text-gray-500"></i>
                  </div>
                  <input type="text" id="checkin-plate" v-model="checkIn.plate" placeholder="Enter vehicle plate"
                    required @input="checkIn.plate = checkIn.plate.toUpperCase()" class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                  shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm pl-10 pr-3 py-2 text-gray-900
                  dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 uppercase" /> <!-- Added uppercase class for immediate visual feedback -->
                </div>
              </div>
              <!-- Vehicle Type -->
              <div>
                <label for="checkin-type"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Type</label>
                <div class="relative rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i class="pi pi-tag text-gray-400 dark:text-gray-500"></i>
                  </div>
                  <select id="checkin-type" v-model="checkIn.type" required
                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm pl-10 pr-3 py-2 text-gray-900 dark:text-gray-100"
                    :class="{ 'text-gray-400 dark:text-gray-500': !checkIn.type }">
                    <option value="" disabled>Select vehicle type</option>
                    <option v-for="vType in vehicleTypes" :key="vType" :value="vType">{{ vType }}</option>
                  </select>
                </div>
              </div>
            </div>
            <!-- Submit Button -->
            <button type="submit"
              class="w-full mt-6 flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 transition duration-150 ease-in-out">
              <i class="pi pi-sign-in mr-2"></i> Check In
            </button>
          </form>
        </div>

        <!-- Check Out Card -->
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col overflow-hidden animate-fade-in delay-400">
          <div
            class="flex items-center p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
            <div
              class="mr-3 flex-shrink-0 bg-red-100 dark:bg-red-500/30 text-red-600 dark:text-red-300 rounded-full p-2">
              <i class="pi pi-arrow-up text-lg leading-none"></i>
            </div>
            <h2 class="text-lg font-semibold text-red-700 dark:text-red-300">Vehicle Check Out (Section {{ sectionId }})</h2>
          </div>
          <form class="p-6 sm:p-8 flex-1 flex flex-col" @submit="handleCheckOut">
            <div class="space-y-5 flex-1">
              <!-- Ticket ID -->
              <div>
                <label for="checkout-ticket"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ticket ID</label>
                <div class="relative rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i class="pi pi-ticket text-gray-400 dark:text-gray-500"></i>
                  </div>
                  <input type="number" id="checkout-ticket" v-model="checkOut.ticketId" placeholder="Enter ticket ID"
                    required min="1"
                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm pl-10 pr-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
                </div>
              </div>
              <!-- License Plate -->
              <div>
                <label for="checkout-plate"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License Plate</label>
                <div class="relative rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i class="pi pi-car text-gray-400 dark:text-gray-500"></i>
                  </div>
                  <input type="text" id="checkout-plate" v-model="checkOut.plate" placeholder="Enter vehicle plate"
                    required @input="checkOut.plate = checkOut.plate.toUpperCase()" class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                  shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm pl-10 pr-3 py-2 text-gray-900
                  dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 uppercase" /> <!-- Added uppercase class -->
                </div>
              </div>
            </div>
            <!-- Submit Button -->
            <button type="submit"
              class="w-full mt-6 flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition duration-150 ease-in-out">
              <i class="pi pi-sign-out mr-2"></i> Check Out
            </button>
          </form>
        </div>

      </div>
    </div>
  </MenuLayout>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
  opacity: 0;
}

.animate-fade-in.delay-200 {
  animation-delay: 0.2s;
}

.animate-fade-in.delay-400 {
  animation-delay: 0.4s;
}
</style>