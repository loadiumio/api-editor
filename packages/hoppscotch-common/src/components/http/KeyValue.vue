<template>
  <div
    class="flex border-b divide-x draggable-content group divide-dividerLight border-dividerLight"
  >
    <span>
      <HoppButtonSecondary
        v-tippy="{
          theme: 'tooltip',
          delay: [500, 20],
          content: index !== total - 1 ? t('action.drag_to_reorder') : null,
        }"
        :icon="IconGripVertical"
        class="opacity-0"
        :class="{
          'draggable-handle cursor-grab group-hover:opacity-100':
            index !== total - 1,
        }"
        tabindex="-1"
      />
    </span>
    <SmartEnvInput
      :model-value="name"
      :placeholder="t('count.key')"
      :auto-complete-source="keyAutoCompleteSource"
      :auto-complete-env="true"
      :envs="envs"
      :inspection-results="inspectionKeyResult"
      @update:model-value="emit('update:name', $event)"
      @change="
        updateEntity(index, {
          id: entityId,
          key: $event,
          value: value,
          active: entityActive,
          description: description ?? '',
        })
      "
    />
    <SmartEnvInput
      :model-value="value"
      :placeholder="t('count.value')"
      :auto-complete-env="true"
      :envs="envs"
      :inspection-results="inspectionValueResult"
      @update:model-value="emit('update:value', $event)"
      @change="
        updateEntity(index, {
          id: entityId,
          key: name,
          value: $event,
          active: entityActive,
          description: description ?? '',
        })
      "
    />
    <span>
      <HoppButtonSecondary
        v-tippy="{ theme: 'tooltip' }"
        :title="t('action.remove')"
        :icon="IconTrash"
        color="red"
        @click="deleteEntity(index)"
      />
    </span>
  </div>
</template>

<script setup lang="ts">
import IconGripVertical from "~icons/lucide/grip-vertical"
import IconTrash from "~icons/lucide/trash"
import { useI18n } from "~/composables/i18n"
import { AggregateEnvironment } from "~/newstore/environments"
import { InspectorResult } from "~/services/inspection"

type Entity = {
  id: number
  key: string
  value: string
  active: boolean
  description: string
}

const t = useI18n()

defineProps<{
  total: number
  index: number
  entityId: number
  isActive: boolean
  entityActive: boolean
  name: string
  value: string
  inspectionKeyResult?: InspectorResult[]
  inspectionValueResult?: InspectorResult[]
  description?: string
  envs?: AggregateEnvironment[]
  keyAutoCompleteSource?: string[]
}>()

const emit = defineEmits<{
  (e: "update:name", value: string): void
  (e: "update:value", value: string): void
  (e: "update:description", value: string): void
  (e: "deleteEntity", value: number): void
  (
    e: "updateEntity",
    { index, payload }: { index: number; payload: Entity }
  ): void
}>()

const updateEntity = (index: number, payload: Entity) => {
  emit("updateEntity", {
    index,
    payload,
  })
}

const deleteEntity = (index: number) => {
  emit("deleteEntity", index)
}
</script>
