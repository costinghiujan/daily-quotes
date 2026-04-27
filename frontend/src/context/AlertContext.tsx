import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { CustomAlert } from '../components/CustomAlert';

interface AlertOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  hideCancel?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface AlertContextProps {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

export const AlertContext = createContext<AlertContextProps>({
  showAlert: () => {},
  hideAlert: () => {},
});

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({
    title: '',
    message: '',
  });

  const showAlert = useCallback((newOptions: AlertOptions) => {
    setOptions(newOptions);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
    setIsLoading(false);
  }, []);

  const handleCancel = useCallback(() => {
    if (options.onCancel) {
      options.onCancel();
    }
    hideAlert();
  }, [options.onCancel, hideAlert]);

  const handleConfirm = async () => {
    if (options.onConfirm) {
      setIsLoading(true);
      try {
        await options.onConfirm();
      } catch (error) {
        console.error('Error in alert confirm:', error);
      } finally {
        setIsLoading(false);
        hideAlert();
      }
    } else {
      hideAlert();
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert
        visible={visible}
        title={options.title}
        message={options.message}
        onCancel={hideAlert}
        onConfirm={handleConfirm}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        isDestructive={options.isDestructive}
        hideCancel={options.hideCancel}
        isLoading={isLoading}
      />
    </AlertContext.Provider>
  );
};
