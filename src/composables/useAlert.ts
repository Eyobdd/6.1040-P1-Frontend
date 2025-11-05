import { ref } from 'vue';

interface AlertOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface AlertState extends AlertOptions {
  visible: boolean;
  resolve?: (value: boolean) => void;
}

const alertState = ref<AlertState>({
  visible: false,
  message: '',
});

export function useAlert() {
  const showAlert = (options: AlertOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      alertState.value = {
        ...options,
        visible: true,
        resolve,
      };
    });
  };

  const hideAlert = (confirmed: boolean) => {
    if (alertState.value.resolve) {
      alertState.value.resolve(confirmed);
    }
    alertState.value.visible = false;
  };

  const confirm = () => hideAlert(true);
  const cancel = () => hideAlert(false);

  return {
    alertState,
    showAlert,
    confirm,
    cancel,
  };
}
