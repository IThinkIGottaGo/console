import {
  ApiConsoleHaloRunV1alpha1ContentApi,
  ApiConsoleHaloRunV1alpha1PluginApi,
  ApiConsoleHaloRunV1alpha1PostApi,
  ApiConsoleHaloRunV1alpha1SinglePageApi,
  ApiConsoleHaloRunV1alpha1ThemeApi,
  ApiConsoleHaloRunV1alpha1UserApi,
  ApiConsoleHaloRunV1alpha1CommentApi,
  ApiConsoleHaloRunV1alpha1ReplyApi,
  ApiConsoleHaloRunV1alpha1StatsApi,
  ApiConsoleHaloRunV1alpha1AttachmentApi,
  ContentHaloRunV1alpha1CategoryApi,
  ContentHaloRunV1alpha1CommentApi,
  ContentHaloRunV1alpha1PostApi,
  ContentHaloRunV1alpha1ReplyApi,
  ContentHaloRunV1alpha1SnapshotApi,
  ContentHaloRunV1alpha1TagApi,
  ContentHaloRunV1alpha1SinglePageApi,
  PluginHaloRunV1alpha1PluginApi,
  PluginHaloRunV1alpha1ReverseProxyApi,
  StorageHaloRunV1alpha1AttachmentApi,
  StorageHaloRunV1alpha1GroupApi,
  StorageHaloRunV1alpha1PolicyApi,
  StorageHaloRunV1alpha1PolicyTemplateApi,
  ThemeHaloRunV1alpha1ThemeApi,
  V1alpha1ConfigMapApi,
  V1alpha1MenuApi,
  V1alpha1MenuItemApi,
  V1alpha1PersonalAccessTokenApi,
  V1alpha1RoleApi,
  V1alpha1RoleBindingApi,
  V1alpha1SettingApi,
  V1alpha1UserApi,
} from "@halo-dev/api-client";
import type { AxiosError, AxiosInstance } from "axios";
import axios from "axios";
import { useUserStore } from "@/stores/user";
import { Toast } from "@halo-dev/components";

const baseURL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

interface ProblemDetail {
  detail: string;
  instance: string;
  status: number;
  title: string;
  type?: string;
}

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ProblemDetail>) => {
    if (/Network Error/.test(error.message)) {
      Toast.error("网络错误，请检查网络连接");
      return Promise.reject(error);
    }

    const errorResponse = error.response;

    if (!errorResponse) {
      Toast.error("网络错误，请检查网络连接");
      return Promise.reject(error);
    }

    const { status } = errorResponse;

    const { title } = errorResponse.data;

    if (status === 400) {
      Toast.error(`请求参数错误：${title}`);
    } else if (status === 401) {
      const userStore = useUserStore();
      userStore.loginModalVisible = true;
      Toast.warning("登录已过期，请重新登录");
      localStorage.removeItem("logged_in");
    } else if (status === 403) {
      Toast.error("无权限访问");
    } else if (status === 404) {
      Toast.error("资源不存在");
    } else if (status === 500) {
      Toast.error(`服务器内部错误：${title}`);
    } else {
      Toast.error(`未知错误：${title}`);
    }

    return Promise.reject(error);
  }
);

const apiClient = setupApiClient(axiosInstance);

function setupApiClient(axios: AxiosInstance) {
  return {
    extension: {
      configMap: new V1alpha1ConfigMapApi(undefined, baseURL, axios),
      personalAccessToken: new V1alpha1PersonalAccessTokenApi(
        undefined,
        baseURL,
        axios
      ),
      roleBinding: new V1alpha1RoleBindingApi(undefined, baseURL, axios),
      role: new V1alpha1RoleApi(undefined, baseURL, axios),
      setting: new V1alpha1SettingApi(undefined, baseURL, axios),
      reverseProxy: new PluginHaloRunV1alpha1ReverseProxyApi(
        undefined,
        baseURL,
        axios
      ),
      plugin: new PluginHaloRunV1alpha1PluginApi(undefined, baseURL, axios),
      user: new V1alpha1UserApi(undefined, baseURL, axios),
      theme: new ThemeHaloRunV1alpha1ThemeApi(undefined, baseURL, axios),
      menu: new V1alpha1MenuApi(undefined, baseURL, axios),
      menuItem: new V1alpha1MenuItemApi(undefined, baseURL, axios),
      post: new ContentHaloRunV1alpha1PostApi(undefined, baseURL, axios),
      singlePage: new ContentHaloRunV1alpha1SinglePageApi(
        undefined,
        baseURL,
        axios
      ),
      category: new ContentHaloRunV1alpha1CategoryApi(
        undefined,
        baseURL,
        axios
      ),
      tag: new ContentHaloRunV1alpha1TagApi(undefined, baseURL, axios),
      snapshot: new ContentHaloRunV1alpha1SnapshotApi(
        undefined,
        baseURL,
        axios
      ),
      comment: new ContentHaloRunV1alpha1CommentApi(undefined, baseURL, axios),
      reply: new ContentHaloRunV1alpha1ReplyApi(undefined, baseURL, axios),
      storage: {
        group: new StorageHaloRunV1alpha1GroupApi(undefined, baseURL, axios),
        attachment: new StorageHaloRunV1alpha1AttachmentApi(
          undefined,
          baseURL,
          axios
        ),
        policy: new StorageHaloRunV1alpha1PolicyApi(undefined, baseURL, axios),
        policyTemplate: new StorageHaloRunV1alpha1PolicyTemplateApi(
          undefined,
          baseURL,
          axios
        ),
      },
    },
    // custom endpoints
    user: new ApiConsoleHaloRunV1alpha1UserApi(undefined, baseURL, axios),
    plugin: new ApiConsoleHaloRunV1alpha1PluginApi(undefined, baseURL, axios),
    theme: new ApiConsoleHaloRunV1alpha1ThemeApi(undefined, baseURL, axios),
    post: new ApiConsoleHaloRunV1alpha1PostApi(undefined, baseURL, axios),
    singlePage: new ApiConsoleHaloRunV1alpha1SinglePageApi(
      undefined,
      baseURL,
      axios
    ),
    content: new ApiConsoleHaloRunV1alpha1ContentApi(undefined, baseURL, axios),
    comment: new ApiConsoleHaloRunV1alpha1CommentApi(undefined, baseURL, axios),
    reply: new ApiConsoleHaloRunV1alpha1ReplyApi(undefined, baseURL, axios),
    stats: new ApiConsoleHaloRunV1alpha1StatsApi(undefined, baseURL, axios),
    attachment: new ApiConsoleHaloRunV1alpha1AttachmentApi(
      undefined,
      baseURL,
      axios
    ),
  };
}

export { apiClient };
