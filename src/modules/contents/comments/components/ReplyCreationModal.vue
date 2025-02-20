<script lang="ts" setup>
import { VModal, VSpace, VButton, IconMotionLine } from "@halo-dev/components";
import SubmitButton from "@/components/button/SubmitButton.vue";
import type {
  ListedComment,
  ListedReply,
  ReplyRequest,
} from "@halo-dev/api-client";
// @ts-ignore
import { Picker } from "emoji-mart";
import data from "@emoji-mart/data";
import i18n from "@emoji-mart/data/i18n/zh.json";
import { computed, nextTick, ref, watch, watchEffect } from "vue";
import { reset } from "@formkit/core";
import cloneDeep from "lodash.clonedeep";
import { setFocus } from "@/formkit/utils/focus";
import { apiClient } from "@/utils/api-client";

const props = withDefaults(
  defineProps<{
    visible?: boolean;
    comment?: ListedComment;
    reply?: ListedReply;
  }>(),
  {
    visible: false,
    comment: undefined,
    reply: undefined,
  }
);

const emit = defineEmits<{
  (event: "update:visible", visible: boolean): void;
  (event: "close"): void;
}>();

const initialFormState: ReplyRequest = {
  raw: "",
  content: "",
  allowNotification: true,
  quoteReply: undefined,
};

const formState = ref<ReplyRequest>(cloneDeep(initialFormState));
const saving = ref(false);

watch(
  () => formState.value.raw,
  (newValue) => {
    formState.value.content = newValue;
  }
);

const formId = computed(() => {
  return `comment-reply-form-${[
    props.comment?.comment.metadata.name,
    props.reply?.reply.metadata.name,
  ].join("-")}`;
});

const contentInputId = computed(() => {
  return `content-input-${[
    props.comment?.comment.metadata.name,
    props.reply?.reply.metadata.name,
  ].join("-")}`;
});

const onVisibleChange = (visible: boolean) => {
  emit("update:visible", visible);
  if (!visible) {
    emit("close");
  }
};

const handleResetForm = () => {
  formState.value = cloneDeep(initialFormState);
  reset(formId.value);
};

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await nextTick();
      setFocus(contentInputId.value);
    } else {
      handleResetForm();
    }
  }
);

const handleCreateReply = async () => {
  try {
    saving.value = true;
    if (props.reply) {
      formState.value.quoteReply = props.reply.reply.metadata.name;
    }
    await apiClient.comment.createReply({
      name: props.comment?.comment.metadata.name as string,
      replyRequest: formState.value,
    });
    onVisibleChange(false);
  } catch (error) {
    console.error("Failed to create comment reply", error);
  } finally {
    saving.value = false;
  }
};

// Emoji picker
const emojiPickerRef = ref<HTMLElement | null>(null);

const handleCreateEmojiPicker = () => {
  const emojiPicker = new Picker({
    data: data,
    theme: "light",
    autoFocus: true,
    i18n: i18n,
    onEmojiSelect: onEmojiSelect,
  });
  emojiPickerRef.value?.appendChild(emojiPicker as unknown as Node);
};

const onEmojiSelect = (emoji: { native: string }) => {
  formState.value.raw += emoji.native;
  setFocus(contentInputId.value);
};

watchEffect(() => {
  if (emojiPickerRef.value) {
    handleCreateEmojiPicker();
  }
});
</script>

<template>
  <VModal
    title="回复"
    :visible="visible"
    :width="500"
    @update:visible="onVisibleChange"
  >
    <FormKit
      :id="formId"
      :name="formId"
      type="form"
      :config="{ validationVisibility: 'submit' }"
      @submit="handleCreateReply"
    >
      <FormKit
        :id="contentInputId"
        v-model="formState.raw"
        type="textarea"
        validation-label="内容"
        :rows="6"
        validation="required|length:0,1024"
      ></FormKit>
    </FormKit>
    <div class="mt-2 flex justify-end">
      <FloatingDropdown>
        <IconMotionLine
          class="h-5 w-5 cursor-pointer text-gray-500 transition-all hover:text-gray-900"
        />
        <template #popper>
          <div ref="emojiPickerRef"></div>
        </template>
      </FloatingDropdown>
    </div>
    <template #footer>
      <VSpace>
        <SubmitButton
          v-if="visible"
          :loading="saving"
          type="secondary"
          @submit="$formkit.submit(formId)"
        >
        </SubmitButton>
        <VButton @click="onVisibleChange(false)">取消 Esc</VButton>
      </VSpace>
    </template>
  </VModal>
</template>
