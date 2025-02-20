<script lang="ts" setup>
// core libs
import { onMounted, ref } from "vue";

// components
import {
  IconAddCircle,
  IconBookRead,
  IconGrid,
  IconList,
  VButton,
  VCard,
  VEmpty,
  VPageHeader,
  VSpace,
  VStatusDot,
  VEntity,
  VEntityField,
  VLoading,
} from "@halo-dev/components";
import TagEditingModal from "./components/TagEditingModal.vue";
import PostTag from "./components/PostTag.vue";

// types
import type { Tag } from "@halo-dev/api-client";
import { usePostTag } from "./composables/use-post-tag";

import { formatDatetime } from "@/utils/date";

import { useRouteQuery } from "@vueuse/router";
import { apiClient } from "@/utils/api-client";
import { usePermission } from "@/utils/permission";

const { currentUserHasPermission } = usePermission();

const viewTypes = [
  {
    name: "list",
    icon: IconList,
  },
  {
    name: "grid",
    icon: IconGrid,
  },
];

const viewType = ref("list");

const { tags, loading, handleFetchTags, handleDelete } = usePostTag({
  fetchOnMounted: true,
});

const editingModal = ref(false);
const selectedTag = ref<Tag | null>(null);

const handleOpenEditingModal = (tag: Tag | null) => {
  selectedTag.value = tag;
  editingModal.value = true;
};

const handleSelectPrevious = () => {
  const currentIndex = tags.value.findIndex(
    (tag) => tag.metadata.name === selectedTag.value?.metadata.name
  );

  if (currentIndex > 0) {
    selectedTag.value = tags.value[currentIndex - 1];
    return;
  }

  if (currentIndex <= 0) {
    selectedTag.value = null;
  }
};

const handleSelectNext = () => {
  if (!selectedTag.value) {
    selectedTag.value = tags.value[0];
    return;
  }
  const currentIndex = tags.value.findIndex(
    (tag) => tag.metadata.name === selectedTag.value?.metadata.name
  );
  if (currentIndex !== tags.value.length - 1) {
    selectedTag.value = tags.value[currentIndex + 1];
  }
};

const onEditingModalClose = () => {
  selectedTag.value = null;
  queryName.value = null;
  handleFetchTags();
};

const queryName = useRouteQuery("name");

onMounted(async () => {
  if (queryName.value) {
    const { data } = await apiClient.extension.tag.getcontentHaloRunV1alpha1Tag(
      {
        name: queryName.value as string,
      }
    );
    selectedTag.value = data;
    editingModal.value = true;
  }
});
</script>
<template>
  <TagEditingModal
    v-model:visible="editingModal"
    :tag="selectedTag"
    @close="onEditingModalClose"
    @next="handleSelectNext"
    @previous="handleSelectPrevious"
  />
  <VPageHeader title="文章标签">
    <template #icon>
      <IconBookRead class="mr-2 self-center" />
    </template>
    <template #actions>
      <VButton
        v-permission="['system:posts:manage']"
        type="secondary"
        @click="editingModal = true"
      >
        <template #icon>
          <IconAddCircle class="h-full w-full" />
        </template>
        新建
      </VButton>
    </template>
  </VPageHeader>
  <div class="m-0 md:m-4">
    <VCard :body-class="['!p-0']">
      <template #header>
        <div class="block w-full bg-gray-50 px-4 py-3">
          <div
            class="relative flex flex-col items-start sm:flex-row sm:items-center"
          >
            <div class="flex w-full flex-1 sm:w-auto">
              <span class="text-base font-medium">
                {{ tags.length }} 个标签
              </span>
            </div>
            <div class="flex flex-row gap-2">
              <div
                v-for="(item, index) in viewTypes"
                :key="index"
                :class="{
                  'bg-gray-200 font-bold text-black': viewType === item.name,
                }"
                class="cursor-pointer rounded p-1 hover:bg-gray-200"
                @click="viewType = item.name"
              >
                <component :is="item.icon" />
              </div>
            </div>
          </div>
        </div>
      </template>
      <VLoading v-if="loading" />
      <Transition v-else-if="!tags.length" appear name="fade">
        <VEmpty message="你可以尝试刷新或者新建标签" title="当前没有标签">
          <template #actions>
            <VSpace>
              <VButton @click="handleFetchTags">刷新</VButton>
              <VButton type="primary" @click="editingModal = true">
                <template #icon>
                  <IconAddCircle class="h-full w-full" />
                </template>
                新建标签
              </VButton>
            </VSpace>
          </template>
        </VEmpty>
      </Transition>

      <div v-else>
        <Transition v-if="viewType === 'list'" appear name="fade">
          <ul
            class="box-border h-full w-full divide-y divide-gray-100"
            role="list"
          >
            <li v-for="(tag, index) in tags" :key="index">
              <VEntity
                :is-selected="selectedTag?.metadata.name === tag.metadata.name"
              >
                <template #start>
                  <VEntityField>
                    <template #title>
                      <PostTag :tag="tag" />
                    </template>
                    <template #description>
                      <a
                        v-if="tag.status?.permalink"
                        :href="tag.status?.permalink"
                        :title="tag.status?.permalink"
                        target="_blank"
                        class="truncate text-xs text-gray-500 group-hover:text-gray-900"
                      >
                        {{ tag.status.permalink }}
                      </a>
                    </template>
                  </VEntityField>
                </template>
                <template #end>
                  <VEntityField v-if="tag.metadata.deletionTimestamp">
                    <template #description>
                      <VStatusDot
                        v-tooltip="`删除中`"
                        state="warning"
                        animate
                      />
                    </template>
                  </VEntityField>
                  <VEntityField
                    :description="`${tag.status?.postCount || 0} 篇文章`"
                  />
                  <VEntityField>
                    <template #description>
                      <span class="truncate text-xs tabular-nums text-gray-500">
                        {{ formatDatetime(tag.metadata.creationTimestamp) }}
                      </span>
                    </template>
                  </VEntityField>
                </template>
                <template
                  v-if="currentUserHasPermission(['system:posts:manage'])"
                  #dropdownItems
                >
                  <VButton
                    v-permission="['system:posts:manage']"
                    v-close-popper
                    block
                    type="secondary"
                    @click="handleOpenEditingModal(tag)"
                  >
                    修改
                  </VButton>
                  <VButton
                    v-permission="['system:posts:manage']"
                    v-close-popper
                    block
                    type="danger"
                    @click="handleDelete(tag)"
                  >
                    删除
                  </VButton>
                </template>
              </VEntity>
            </li>
          </ul>
        </Transition>

        <Transition v-else appear name="fade">
          <div class="flex flex-wrap gap-3 p-4" role="list">
            <PostTag
              v-for="(tag, index) in tags"
              :key="index"
              :tag="tag"
              @click="handleOpenEditingModal(tag)"
            />
          </div>
        </Transition>
      </div>
    </VCard>
  </div>
</template>
