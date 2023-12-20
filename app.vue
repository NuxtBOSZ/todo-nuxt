<script lang="ts" setup>
import type {TaskIdDTO} from "~/dto/TaskIdDTO";

const runtimeConfig = useRuntimeConfig()


// Columns
const columns = [{
  key: 'id',
  label: '#',
  sortable: true
}, {
  key: 'name',
  label: 'Name',
  sortable: true
}, {
  key: 'status',
  label: 'Status',
  sortable: true
}, {
  key: 'action',
  label: 'Action',
  sortable: false
}]


const isOpenTab = ref(false)
const selectedRows = ref<TaskIdDTO[]>([])

const isOpenItem = ref(false)
const isOpenEditItem = ref(false)

const selectTask = ref<TaskIdDTO>();

const isOpenCreateItem = ref(false)
const isOpenCreateStatus = ref(false)
const isOpenRenameStatus = ref(false)

const renameStatus = ref<string>("");

function select(row: TaskIdDTO) {
  selectTask.value = row;
  isOpenItem.value = true;
}


// Filters
const todoStatus = ref<string[]>(["TODO", "DOING", "DONE"])
const todoStatusWithNone = computed<string[]>(() => {
      // let tmp: string[]= todoStatus.value;
      // tmp.unshift("NONE");
      // return tmp;
      return ["NONE", ...todoStatus.value]
    }
);
const selectedStatus = ref(todoStatusWithNone.value[0])

async function fetchStatus() {
  todoStatus.value = await $fetch(`${runtimeConfig.public.apiBase}/status`)
}

fetchStatus();

// Pagination
const page = ref(1)
const pageCount = ref(10)
const pageTotal = computed(() => page.value * 10 + 1)
const isPagination = ref(true);
const queryTask = computed(() => {
  let tmp = {};

  if (isPagination.value) {
    tmp['pagination'] = page.value - 1;
  }
  if (selectedStatus.value != "NONE") {
    tmp['status'] = selectedStatus.value;
  }

  return tmp;
});

// Data
const {
  data: todos,
  pending,
  refresh
} = await useLazyAsyncData<TaskIdDTO[]>('todos', () => ($fetch as any)(`${runtimeConfig.public.apiBase}/task`, {
  query: queryTask.value
}), {
  default: () => [],
  watch: [queryTask]
})

const count = computed<{ type: string, count: number }[]>(() => {
  let tmp: { type: string, count: number }[] = [];
  todos.value.forEach(e => {

    const maTyp = tmp.some(item => item.type === e.status);

    if (maTyp) {
      tmp.find(item => item.type === e.status).count++;
    } else {
      tmp.push({
        type: e.status,
        count: 1
      })
    }

  })

  return tmp;
})


function getColor(type: string) {

  if (type == "DONE") {
    return "emerald"
  } else if (type == "DOING") {
    return "sky"
  } else if (type == "TODO") {
    return "violet"
  } else {
    return "orange"
  }

}

const options = (row: TaskIdDTO) => {
  return [

    [
      {
        label: 'Edit',
        icon: 'i-heroicons-pencil-square-20-solid',
        click: () => {
          selectTask.value = row;
          isOpenEditItem.value = true;
          setTask.name = selectTask.value.name;
          setTask.description = selectTask.value.description;
        }
      },
      {
        label: 'Status',
        slot: 'status',
        icon: 'i-heroicons-pencil-square-20-solid'
      }
    ],
    [
      {
        label: 'Delete',
        icon: 'i-heroicons-trash-20-solid',
        click: () => {
          noDeleteTask(row.id);
        }
      }
    ],
    [
      {
        label: 'open',
        icon: 'i-heroicons-arrows-pointing-out',
        click: () => {
          select(row)
        }
      }
    ]

  ]
}

// form
import type {FormError, FormSubmitEvent} from '#ui/types'
import type {TaskDTO} from "~/dto/TaskDTO";


// create task
const stateTaskDTOCreate = reactive<TaskDTO>({
  name: "",
  description: ""
})

const validateTaskDTOCreate = (state: any): FormError[] => {
  const errors = []
  if (!state.name) errors.push({path: 'name', message: 'Required'})
  if (!state.description) errors.push({path: 'description', message: 'Required'})
  return errors
}

async function onSubmitTaskDTOCreate(event: FormSubmitEvent<any>) {
  await $fetch(`${runtimeConfig.public.apiBase}/task`, {
    method: 'POST',
    body: event.data
  })
  isOpenCreateItem.value = false;
  stateTaskDTOCreate.description = "";
  stateTaskDTOCreate.name = "";
  await refresh();
}

const setTask = reactive<TaskDTO>({
  name: "",
  description: ""
})

async function noSetTask(id: number, task: TaskDTO) {
  await $fetch(`${runtimeConfig.public.apiBase}/task/${id}`, {
    method: 'PUT',
    body: task
  })
  await refresh();
}

async function onSubmitTaskDTOSet(event: FormSubmitEvent<any>) {
  if (selectTask.value)
    await noSetTask(selectTask.value.id, event.data);
}

// create status

const nameCreateStatus = ref("");

async function onCreateStatus() {
  await $fetch(`${runtimeConfig.public.apiBase}/status/${nameCreateStatus.value}`, {
    method: 'POST',
  })
  isOpenCreateStatus.value = false;
  nameCreateStatus.value = "";
  await fetchStatus();
}

// set status
const nameSetStatus = ref(todoStatus.value[0]);

async function noSetStatus(id: number, statusName: string) {
  await $fetch(`${runtimeConfig.public.apiBase}/task/${id}/${statusName}`, {
    method: 'PUT',
  })
  await refresh();
}

async function noSetStatusSelectedRows(statusName: string) {
  for (const e of selectedRows.value) {
    await $fetch(`${runtimeConfig.public.apiBase}/task/${e.id}/${statusName}`, {
      method: 'PUT',
    });
  }
  await refresh();
}

async function noDeleteStatus(statusName: string) {
  await $fetch(`${runtimeConfig.public.apiBase}/status/${statusName}`, {
    method: 'DELETE',
  })
  await fetchStatus();
  selectedStatus.value = todoStatusWithNone.value[0];
}


async function noRenameStatus(statusName: string, newName: string) {
  await $fetch(`${runtimeConfig.public.apiBase}/status/${statusName}/${newName}`, {
    method: 'PUT',
  })
  await fetchStatus();
  selectedStatus.value = todoStatusWithNone.value[0];
}


async function noDeleteTask(id: number) {
  await $fetch(`${runtimeConfig.public.apiBase}/task/${id}`, {
    method: 'DELETE',
  })
  await refresh();
}

async function noDeleteTaskSelectedRows() {
  for (const e of selectedRows.value) {
    await $fetch(`${runtimeConfig.public.apiBase}/task/${e.id}`, {
      method: 'DELETE',
    });
  }
  await refresh();
}

</script>

<template>
  <UCard
      class="w-full"
      :ui="{
      base: '',
      ring: '',
      divide: 'divide-y divide-gray-200 dark:divide-gray-700',
      header: { padding: 'px-4 py-5' },
      body: { padding: '', base: 'divide-y divide-gray-200 dark:divide-gray-700' },
      footer: { padding: 'p-4' }
    }"
  >
    <template #header>
      <h2 class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
        Todos
      </h2>
    </template>

    <!-- Filters -->
    <div class="flex items-center justify-between gap-3 px-4 py-3">
      <UButtonGroup size="sm" orientation="horizontal">
        <UButton
            icon="i-heroicons-plus"
            size="sm"
            color="sky"
            square
            variant="outline"
            @click="isOpenCreateItem = true"

        />
        <UButton
            v-if="selectedRows.length != 0"
            icon="i-heroicons-pencil-square"
            size="sm"
            color="emerald"
            square
            variant="solid"
            @click="isOpenTab = true"
        />
      </UButtonGroup>
      <UButtonGroup size="sm" orientation="horizontal">
        <UButton
            icon="i-heroicons-pencil-square-20-solid"
            size="sm"
            color="emerald"
            square
            variant="outline"
            @click="isOpenRenameStatus = true"
        />
        <UButton
            icon="i-heroicons-trash"
            size="sm"
            color="red"
            square
            variant="outline"
            @click="noDeleteStatus(selectedStatus)"
        />
        <USelectMenu v-model="selectedStatus" :options="todoStatusWithNone" class="w-40"/>
        <UButton
            icon="i-heroicons-plus"
            size="sm"
            color="sky"
            square
            variant="outline"
            @click="isOpenCreateStatus = true"
        />
      </UButtonGroup>
    </div>

    <!-- Table -->
    <UTable
        v-model="selectedRows"
        :rows="todos"
        :columns="columns"
        :loading="pending"
        sort-asc-icon="i-heroicons-arrow-up"
        sort-desc-icon="i-heroicons-arrow-down"
        class="w-full"
        :ui="{ td: { base: 'max-w-[0] truncate' } }"
    >
      <!--      @select="select"-->
      <template #status-data="{ row }">
        <UBadge size="xs" :label="row.status"
                :color="getColor(row.status)" variant="outline"/>
      </template>
      <template #action-data="{ row }">
        <UButtonGroup size="sm" orientation="horizontal">

          <UDropdown :items="options(row)" :popper="{ placement: 'bottom-start' }">

            <template #status="{ item }">
              <UButtonGroup size="xs" orientation="horizontal">
                <UBadge size="2xs" :label="row.status"
                        :color="getColor(row.status)" variant="outline"/>
                <UBadge size="2xs"
                        color="black" variant="outline">
                  <UIcon name="i-heroicons-arrow-right"/>
                </UBadge>
                <USelectMenu v-model="nameSetStatus" :options="todoStatus"/>
                <UButton
                    :icon="item.icon"
                    size="2xs"
                    color="emerald"
                    square
                    @click="noSetStatus(row.id,nameSetStatus)"
                />
              </UButtonGroup>
            </template>

            <UButton color="white" label="Options" trailing-icon="i-heroicons-chevron-down-20-solid"/>
          </UDropdown>
          <UButton
              icon="i-heroicons-arrows-pointing-out"
              size="sm"
              color="emerald"
              square
              variant="solid"
              @click="select(row)"
          />
        </UButtonGroup>
      </template>

    </UTable>

    <!-- Number of rows & Pagination -->
    <template #footer>
      <div class="flex flex-wrap justify-between items-center">
        <div class="w-[50%]">
          <UMeterGroup :max="todos.length" size="md" icon="i-heroicons-minus">
            <UMeter v-for="(item, index) in count" :key="index" :value="item.count" :color="getColor(item.type)"
                    :label="item.type"/>
          </UMeterGroup>
        </div>
        <div class="flex gap-3 flex-wrap justify-between items-center">
          <UCheckbox v-model="isPagination" :label="isPagination ? '':'pagination'"/>
          <UPagination
              v-if="isPagination"
              v-model="page"
              :page-count="pageCount"
              :total="pageTotal"
              :ui="{
            wrapper: 'flex items-center gap-1',
            rounded: '!rounded-full min-w-[32px] justify-center',
            default: {
              activeButton: {
                variant: 'outline'
              }
            }
          }"
          />
        </div>
      </div>
    </template>
  </UCard>
  <USlideover v-model="isOpenTab">
    <div class="h-full p-4 flex flex-col justify-start items-center	gap-4 overflow-auto">
      <UButtonGroup orientation="horizontal">
        <UBadge label="status:"
                color="emerald" variant="outline"/>
        <USelectMenu v-model="nameSetStatus" :options="todoStatus"/>
        <UButton
            icon="i-heroicons-pencil-square-20-solid"
            color="emerald"
            square
            @click="noSetStatusSelectedRows(nameSetStatus)"
        />
      </UButtonGroup>
      <UButton
          icon="i-heroicons-trash"
          color="red"
          label="delete"
          square
          @click="noDeleteTaskSelectedRows"
      />
    </div>
  </USlideover>
  <UModal v-model="isOpenItem">
    <div class="p-4 flex flex-col justify-center items-center ">
      <p class="text-xl">{{ selectTask.name }}</p>
      <UDivider label="description"/>
      {{ selectTask.description }}
      <UDivider label="status"/>
      <UBadge size="xs" :label="selectTask.status"
              :color="getColor(selectTask.status)" variant="outline"/>
    </div>
  </UModal>
  <USlideover v-model="isOpenEditItem">
    <div class="h-full p-4 overflow-auto">
      <div class="flex justify-center">
        <UButtonGroup orientation="horizontal">
          <UBadge :label="selectTask.status"
                  :color="getColor(selectTask.status)" variant="outline"/>
          <UBadge
              color="black" variant="outline">
            <UIcon name="i-heroicons-arrow-right"/>
          </UBadge>
          <USelectMenu v-model="nameSetStatus" :options="todoStatus"/>
          <UButton
              icon="i-heroicons-pencil-square-20-solid"
              color="emerald"
              square
              @click="noSetStatus(selectTask.id,nameSetStatus)"
          />
        </UButtonGroup>
      </div>
      <div>
        <UForm :validate="validateTaskDTOCreate" :state="setTask" class="space-y-4"
               @submit="onSubmitTaskDTOSet">
          <UFormGroup label="Name" name="name">
            <UInput v-model="setTask.name"/>
          </UFormGroup>

          <UFormGroup label="Description" name="description">
            <UTextarea autoresize v-model="setTask.description"/>
          </UFormGroup>

          <UButton type="submit">
            Submit
          </UButton>
        </UForm>
      </div>
    </div>
  </USlideover>
  <UModal v-model="isOpenCreateItem">
    <div class="p-4">
      <UForm :validate="validateTaskDTOCreate" :state="stateTaskDTOCreate" class="space-y-4"
             @submit="onSubmitTaskDTOCreate">
        <UFormGroup label="Name" name="name">
          <UInput v-model="stateTaskDTOCreate.name"/>
        </UFormGroup>

        <UFormGroup label="Description" name="description">
          <UTextarea autoresize v-model="stateTaskDTOCreate.description"/>
        </UFormGroup>

        <UButton type="submit">
          Submit
        </UButton>
      </UForm>
    </div>
  </UModal>
  <UModal v-model="isOpenCreateStatus">
    <div class="p-4">
      <UButtonGroup class="flex justify-center" size="sm" orientation="horizontal">
        <UInput v-model="nameCreateStatus" color="sky" variant="outline" placeholder="Name"/>
        <UButton
            icon="i-heroicons-arrow-up-tray"
            size="sm"
            square
            color="sky"
            variant="outline"
            @click="onCreateStatus"
        />
      </UButtonGroup>
    </div>
  </UModal>
  <UModal v-model="isOpenRenameStatus">
    <div class="p-4">
      <UButtonGroup class="flex justify-center" size="sm" orientation="horizontal">
        <UInput v-model="renameStatus" color="emerald" variant="outline" placeholder="Name"/>
        <UButton
            icon="i-heroicons-arrow-up-tray"
            size="sm"
            square
            color="emerald"
            variant="outline"
            @click="noRenameStatus(selectedStatus,renameStatus)"
        />
      </UButtonGroup>
    </div>
  </UModal>
</template>