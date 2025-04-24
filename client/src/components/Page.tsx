import { useNavigate } from 'react-router-dom';
import { backButton } from '@telegram-apps/sdk-react';
import { PropsWithChildren, useEffect } from 'react';

export function Page({ children, back = true, backTo }: PropsWithChildren<{
  /**
   * True if it is allowed to go back from this page.
   */
  back?: boolean,
  /**
   * Custom path to navigate to when back button is clicked.
   * If not provided, will use browser history (-1).
   */
  backTo?: string
}>) {
  const navigate = useNavigate();

  useEffect(() => {
    if (back) {
      backButton.show();
      return backButton.onClick(() => {
        if (backTo) {
          navigate(backTo);
        } else {
          navigate(-1);
        }
      });
    }
    backButton.hide();
  }, [back, backTo, navigate]);

  return <>{children}</>;
}