<script lang="ts" setup>
// core libs
import { computed, nextTick, onMounted, provide, ref, watch } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { apiClient } from "@/utils/api-client";

// libs
import cloneDeep from "lodash.clonedeep";

// hooks
import { useSettingForm } from "@/composables/use-setting-form";

// components
import {
  VButton,
  VCard,
  VPageHeader,
  VTabbar,
  VAvatar,
  VLoading,
} from "@halo-dev/components";
import BasicLayout from "@/layouts/BasicLayout.vue";

// types
import type { Ref } from "vue";
import type { Plugin, SettingForm } from "@halo-dev/api-client";
import { usePermission } from "@/utils/permission";

const { currentUserHasPermission } = usePermission();

interface PluginTab {
  id: string;
  label: string;
  route: {
    name: string;
    params?: Record<string, string>;
  };
}

const initialTabs: PluginTab[] = [
  {
    id: "detail",
    label: "详情",
    route: {
      name: "PluginDetail",
    },
  },
];

const route = useRoute();
const router = useRouter();

const plugin = ref<Plugin>();
const tabs = ref<PluginTab[]>(cloneDeep(initialTabs));
const activeTab = ref<string>();

provide<Ref<Plugin | undefined>>("plugin", plugin);
provide<Ref<string | undefined>>("activeTab", activeTab);

const settingName = computed(() => plugin.value?.spec.settingName);
const configMapName = computed(() => plugin.value?.spec.configMapName);

const { setting, handleFetchSettings } = useSettingForm(
  settingName,
  configMapName
);

const handleFetchPlugin = async () => {
  try {
    const response =
      await apiClient.extension.plugin.getpluginHaloRunV1alpha1Plugin({
        name: route.params.name as string,
      });
    plugin.value = response.data;
  } catch (e) {
    console.error(e);
  }
};

const handleTabChange = (id: string) => {
  const tab = tabs.value.find((item) => item.id === id);
  if (tab) {
    activeTab.value = tab.id;
    router.push(tab.route);
  }
};

const handleTriggerTabChange = () => {
  if (route.name === "PluginSetting") {
    const tab = tabs.value.find((tab) => {
      return (
        tab.route.name === route.name &&
        tab.route.params?.group === route.params.group
      );
    });
    if (tab) {
      activeTab.value = tab.id;
      return;
    }
    handleTabChange(tabs.value[0].id);
    return;
  }
  const tab = tabs.value.find((tab) => tab.route.name === route.name);
  activeTab.value = tab ? tab.id : tabs.value[0].id;
};

onMounted(async () => {
  await handleFetchPlugin();

  if (!currentUserHasPermission(["system:settings:view"])) {
    handleTriggerTabChange();
    return;
  }

  await handleFetchSettings();

  tabs.value = cloneDeep(initialTabs);

  if (setting.value) {
    const { forms } = setting.value.spec;
    tabs.value = [
      ...tabs.value,
      ...forms.map((item: SettingForm) => {
        return {
          id: item.group,
          label: item.label || "",
          route: {
            name: "PluginSetting",
            params: {
              group: item.group,
            },
          },
        };
      }),
    ] as PluginTab[];
  }

  await nextTick();

  handleTriggerTabChange();
});

watch([() => route.name, () => route.params], () => {
  handleTriggerTabChange();
});
</script>
<template>
  <BasicLayout>
    <VPageHeader :title="plugin?.spec?.displayName">
      <template #icon>
        <VAvatar
          v-if="plugin"
          :src="plugin.status?.logo"
          :alt="plugin.spec.displayName"
          class="mr-2"
          size="sm"
        />
      </template>
      <template #actions>
        <VButton class="opacity-0" type="secondary">安装</VButton>
      </template>
    </VPageHeader>

    <div class="m-0 md:m-4">
      <VCard :body-class="['!p-0']">
        <template #header>
          <VTabbar
            v-model:active-id="activeTab"
            :items="tabs"
            class="w-full !rounded-none"
            type="outline"
            @change="handleTabChange"
          ></VTabbar>
        </template>
      </VCard>
      <div class="bg-white">
        <RouterView :key="activeTab" v-slot="{ Component }">
          <template v-if="Component">
            <Suspense>
              <component :is="Component"></component>
              <template #fallback>
                <VLoading />
              </template>
            </Suspense>
          </template>
        </RouterView>
      </div>
    </div>
  </BasicLayout>
</template>
