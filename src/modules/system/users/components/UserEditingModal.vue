<script lang="ts" setup>
// core libs
import { computed, ref, watch } from "vue";
import { apiClient } from "@/utils/api-client";
import type { User } from "@halo-dev/api-client";

// components
import {
  IconCodeBoxLine,
  IconEye,
  VButton,
  VCodemirror,
  VModal,
  VSpace,
} from "@halo-dev/components";
import SubmitButton from "@/components/button/SubmitButton.vue";

// libs
import YAML from "yaml";
import cloneDeep from "lodash.clonedeep";
import { reset } from "@formkit/core";

// hooks
import { setFocus } from "@/formkit/utils/focus";

const props = withDefaults(
  defineProps<{
    visible: boolean;
    user?: User;
  }>(),
  {
    visible: false,
    user: undefined,
  }
);

const emit = defineEmits<{
  (event: "update:visible", visible: boolean): void;
  (event: "close"): void;
}>();

const initialFormState: User = {
  spec: {
    displayName: "",
    avatar: "",
    email: "",
    phone: "",
    password: "",
    bio: "",
    disabled: false,
    loginHistoryLimit: 0,
  },
  apiVersion: "v1alpha1",
  kind: "User",
  metadata: {
    name: "",
  },
};

const formState = ref<User>(cloneDeep(initialFormState));
const saving = ref(false);
const rawMode = ref(false);
const raw = ref("");

const isUpdateMode = computed(() => {
  return !!formState.value.metadata.creationTimestamp;
});

const creationModalTitle = computed(() => {
  return isUpdateMode.value ? "编辑用户" : "新增用户";
});

const modalWidth = computed(() => {
  return rawMode.value ? 800 : 700;
});

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      setFocus(isUpdateMode.value ? "displayNameInput" : "userNameInput");
    } else {
      handleResetForm();
    }
  }
);

watch(
  () => props.user,
  (user) => {
    if (user) {
      formState.value = cloneDeep(user);
    } else {
      handleResetForm();
    }
  }
);

const onVisibleChange = (visible: boolean) => {
  emit("update:visible", visible);
  if (!visible) {
    emit("close");
  }
};

const handleResetForm = () => {
  formState.value = cloneDeep(initialFormState);
  reset("user-form");
};

const handleCreateUser = async () => {
  try {
    saving.value = true;
    if (isUpdateMode.value) {
      await apiClient.extension.user.updatev1alpha1User({
        name: formState.value.metadata.name,
        user: formState.value,
      });
    } else {
      await apiClient.extension.user.createv1alpha1User({
        user: formState.value,
      });
    }

    onVisibleChange(false);
  } catch (e) {
    console.error("Failed to create or update user", e);
  } finally {
    saving.value = false;
  }
};

const handleRawModeChange = () => {
  rawMode.value = !rawMode.value;

  if (rawMode.value) {
    raw.value = YAML.stringify(formState.value);
  } else {
    formState.value = YAML.parse(raw.value);
  }
};
</script>
<template>
  <VModal
    :title="creationModalTitle"
    :visible="visible"
    :width="modalWidth"
    @update:visible="onVisibleChange"
  >
    <template #actions>
      <span @click="handleRawModeChange">
        <IconCodeBoxLine v-if="!rawMode" />
        <IconEye v-else />
      </span>
    </template>

    <VCodemirror v-show="rawMode" v-model="raw" height="50vh" language="yaml" />

    <div v-show="!rawMode">
      <FormKit
        id="user-form"
        name="user-form"
        :config="{ validationVisibility: 'submit' }"
        type="form"
        @submit="handleCreateUser"
      >
        <FormKit
          id="userNameInput"
          v-model="formState.metadata.name"
          :disabled="isUpdateMode"
          label="用户名"
          type="text"
          name="name"
          validation="required|alphanumeric|length:0,50"
        ></FormKit>
        <FormKit
          id="displayNameInput"
          v-model="formState.spec.displayName"
          label="显示名称"
          type="text"
          name="displayName"
          validation="required|length:0,50"
        ></FormKit>
        <FormKit
          v-model="formState.spec.email"
          label="电子邮箱"
          type="email"
          name="email"
          validation="required|email|length:0,100"
        ></FormKit>
        <FormKit
          v-model="formState.spec.phone"
          label="手机号"
          type="text"
          name="phone"
          validation="length:0,20"
        ></FormKit>
        <FormKit
          v-model="formState.spec.avatar"
          label="头像"
          type="attachment"
          name="avatar"
          validation="url|length:0,1024"
        ></FormKit>
        <FormKit
          v-model="formState.spec.bio"
          label="描述"
          type="textarea"
          name="bio"
          validation="length:0,2048"
        ></FormKit>
      </FormKit>
    </div>
    <template #footer>
      <VSpace>
        <SubmitButton
          v-if="visible"
          :loading="saving"
          type="secondary"
          @submit="$formkit.submit('user-form')"
        >
        </SubmitButton>
        <VButton @click="onVisibleChange(false)">取消 Esc</VButton>
      </VSpace>
    </template>
  </VModal>
</template>
