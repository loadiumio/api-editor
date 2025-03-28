<script setup lang="ts">
import { HoppCollection } from "@hoppscotch/data"
import { computed, Ref, ref, watch } from "vue"
import { useI18n } from "~/composables/i18n"
import { SupportedImportFormat } from "./../types"

const t = useI18n()

type Feature = "collections" | "requests"

type FeatureStatus = "SUPPORTED" | "NOT_SUPPORTED_BY_SOURCE"

type FeatureWithCount = {
  count: number
  label: string
  id: Feature
}

const props = defineProps<{
  importFormat: SupportedImportFormat
  collections: HoppCollection[]
  onClose: () => void
}>()

const importSourceAndSupportedFeatures: Record<
  SupportedImportFormat,
  Record<Feature, FeatureStatus>
> = {
  hoppscotch: {
    collections: "SUPPORTED",
    requests: "SUPPORTED",
  },
  postman: {
    collections: "SUPPORTED",
    requests: "SUPPORTED",
  },
  insomnia: {
    collections: "SUPPORTED",
    requests: "SUPPORTED",
  },
  openapi: {
    collections: "SUPPORTED",
    requests: "SUPPORTED",
  },
  har: {
    collections: "SUPPORTED",
    requests: "SUPPORTED",
  },
}

const featuresWithCount: Ref<FeatureWithCount[]> = ref([])

const countCollections = (collections: HoppCollection[]) => {
  let collectionCount = 0
  let requestCount = 0

  const flattenHoppCollections = (_collections: HoppCollection[]) => {
    _collections.forEach((collection) => {
      collectionCount++
      requestCount += collection.requests.length
      flattenHoppCollections(collection.folders)
    })
  }

  flattenHoppCollections(collections)

  return {
    collectionCount,
    requestCount,
  }
}

watch(
  props.collections,
  (collections) => {
    const { collectionCount, requestCount } = countCollections(collections)

    featuresWithCount.value = [
      {
        count: collectionCount,
        label: "import.import_summary_collections_title",
        id: "collections" as const,
      },
      {
        count: requestCount,
        label: "import.import_summary_requests_title",
        id: "requests" as const,
      },
    ]
  },
  {
    immediate: true,
  }
)

const featureSupportForImportFormat = computed(() => {
  return importSourceAndSupportedFeatures[props.importFormat]
})

const visibleFeatures = computed(() => {
  return featuresWithCount.value.filter((feature) => {
    return (
      importSourceAndSupportedFeatures[props.importFormat][feature.id] !==
      "NOT_SUPPORTED_BY_SOURCE"
    )
  })
})
</script>

<template>
  <div class="space-y-4">
    <div v-for="feature in visibleFeatures" :key="feature.id">
      <p class="flex items-center">
        <span
          class="inline-flex items-center justify-center flex-shrink-0 mr-4 border-4 rounded-full border-primary"
          :class="{
            'text-green-500':
              featureSupportForImportFormat[feature.id] === 'SUPPORTED',
          }"
        >
          <icon-lucide-check-circle
            v-if="featureSupportForImportFormat[feature.id] === 'SUPPORTED'"
            class="svg-icons"
          />
        </span>
        <span>{{ t(feature.label) }}</span>
      </p>

      <p class="ml-10 text-secondaryLight">
        <template
          v-if="featureSupportForImportFormat[feature.id] === 'SUPPORTED'"
        >
          {{ feature.count }}
          {{
            feature.count != 1
              ? t(feature.label)
              : t(feature.label).slice(0, -1)
          }}
          Imported
        </template>
      </p>
    </div>
  </div>

  <div class="mt-10">
    <HoppButtonSecondary
      class="w-full"
      :label="t('action.close')"
      outline
      filled
      @click="onClose"
    />
  </div>
</template>
