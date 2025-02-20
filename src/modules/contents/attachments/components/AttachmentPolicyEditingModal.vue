<script lang="ts" setup>
import { VButton, VModal, VSpace } from "@halo-dev/components";
import SubmitButton from "@/components/button/SubmitButton.vue";
import type { Policy, PolicyTemplate } from "@halo-dev/api-client";
import cloneDeep from "lodash.clonedeep";
import { computed, ref, watch, watchEffect } from "vue";
import { useSettingForm } from "@/composables/use-setting-form";
import { apiClient } from "@/utils/api-client";
import {
  reset,
  type FormKitSchemaCondition,
  type FormKitSchemaNode,
} from "@formkit/core";
import { setFocus } from "@/formkit/utils/focus";

const props = withDefaults(
  defineProps<{
    visible: boolean;
    policy?: Policy;
  }>(),
  {
    visible: false,
    policy: undefined,
  }
);

const emit = defineEmits<{
  (event: "update:visible", visible: boolean): void;
  (event: "close"): void;
}>();

const initialFormState: Policy = {
  spec: {
    displayName: "",
    templateName: "",
    configMapName: "",
  },
  apiVersion: "storage.halo.run/v1alpha1",
  kind: "Policy",
  metadata: {
    name: "",
    generateName: "attachment-policy-",
  },
};

const formState = ref<Policy>(cloneDeep(initialFormState));
const policyTemplate = ref<PolicyTemplate | undefined>();

const settingName = computed(() => policyTemplate.value?.spec?.settingName);

const configMapName = computed({
  get() {
    return formState.value.spec.configMapName;
  },
  set(value) {
    formState.value.spec.configMapName = value;
  },
});

const {
  setting,
  configMapFormData,
  configMap,
  saving,
  handleFetchConfigMap,
  handleFetchSettings,
  handleSaveConfigMap,
  handleReset: handleResetSettingForm,
} = useSettingForm(settingName, configMapName);

const formSchema = computed(() => {
  if (!setting.value) {
    return undefined;
  }
  const { forms } = setting.value.spec;
  return forms.find((item) => item.group === "default")?.formSchema as (
    | FormKitSchemaCondition
    | FormKitSchemaNode
  )[];
});

watchEffect(() => {
  if (settingName.value) {
    handleFetchSettings();
  }
});

watchEffect(() => {
  if (configMapName.value && setting.value) {
    handleFetchConfigMap();
  }
});

const isUpdateMode = computed(() => {
  return !!formState.value.metadata.creationTimestamp;
});

const modalTitle = computed(() => {
  return isUpdateMode.value
    ? `编辑策略：${props.policy?.spec.displayName}`
    : `新增策略：${policyTemplate.value?.spec?.displayName}`;
});

const handleSave = async () => {
  try {
    saving.value = true;

    if (!isUpdateMode.value) {
      configMap.value.metadata.name = "";
      configMap.value.metadata.generateName = "configMap-";
    }

    await handleSaveConfigMap();

    if (isUpdateMode.value) {
      await apiClient.extension.storage.policy.updatestorageHaloRunV1alpha1Policy(
        {
          name: formState.value.metadata.name,
          policy: formState.value,
        }
      );
    } else {
      formState.value.spec.configMapName = configMap.value.metadata.name;
      await apiClient.extension.storage.policy.createstorageHaloRunV1alpha1Policy(
        {
          policy: formState.value,
        }
      );
    }

    onVisibleChange(false);
  } catch (e) {
    console.error("Failed to save attachment policy", e);
  } finally {
    saving.value = false;
  }
};

const handleResetForm = () => {
  formState.value = cloneDeep(initialFormState);
  reset("attachment-policy-form");
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      setFocus("displayNameInput");
    } else {
      const timer = setTimeout(() => {
        policyTemplate.value = undefined;
        handleResetForm();
        handleResetSettingForm();
        clearTimeout(timer);
      }, 100);
    }
  }
);

watch(
  () => props.policy,
  async (policy) => {
    if (policy) {
      formState.value = cloneDeep(policy);

      const { templateName } = formState.value.spec;

      // Get policy template
      if (templateName) {
        const { data } =
          await apiClient.extension.storage.policyTemplate.getstorageHaloRunV1alpha1PolicyTemplate(
            {
              name: templateName,
            }
          );
        policyTemplate.value = data;
      }
    } else {
      setTimeout(() => {
        policyTemplate.value = undefined;
        handleResetForm();
        handleResetSettingForm();
      }, 100);
    }
  }
);

const onVisibleChange = (visible: boolean) => {
  emit("update:visible", visible);
  if (!visible) {
    emit("close");
  }
};
</script>
<template>
  <VModal
    :title="modalTitle"
    :visible="visible"
    :width="600"
    @update:visible="onVisibleChange"
  >
    <FormKit
      v-if="formSchema && configMapFormData"
      id="attachment-policy-form"
      v-model="configMapFormData['default']"
      name="attachment-policy-form"
      :actions="false"
      :preserve="true"
      type="form"
      :config="{ validationVisibility: 'submit' }"
      @submit="handleSave"
    >
      <FormKit
        id="displayNameInput"
        v-model="formState.spec.displayName"
        label="名称"
        type="text"
        name="displayName"
        validation="required|length:0,50"
      ></FormKit>
      <FormKitSchema
        :schema="formSchema"
        :data="configMapFormData['default']"
      />
    </FormKit>

    <template #footer>
      <VSpace>
        <SubmitButton
          v-if="visible"
          :loading="saving"
          type="secondary"
          @submit="$formkit.submit('attachment-policy-form')"
        >
        </SubmitButton>
        <VButton @click="onVisibleChange(false)">取消 Esc</VButton>
      </VSpace>
    </template>
  </VModal>
</template>
