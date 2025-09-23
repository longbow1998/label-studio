import { Button } from "@humansignal/ui";
import { modal } from "../../components/Modal/Modal";
import { useModalControls } from "../../components/Modal/ModalPopup";
import { Space } from "../../components/Space/Space";
import { cn } from "../../utils/bem";
import { useTranslation } from "react-i18next";

export const WebhookDeleteModal = ({ onDelete }) => {
  const { t } = useTranslation();

  return modal({
    title: t("delete"),
    body: () => {
      const ctrl = useModalControls();
      const rootClass = cn("webhook-delete-modal");
      return (
        <div className={rootClass}>
          <div className={rootClass.elem("modal-text")}>
            {t("are_you_sure_you_want_to_delete_the_webhook")}
          </div>
        </div>
      );
    },
    footer: () => {
      const ctrl = useModalControls();
      return (
        <Space align="end">
          <Button
            className="w-44"
            look="outlined"
            onClick={() => {
              ctrl.hide();
            }}
            aria-label={t("cancel_webhook_deletion")}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="negative"
            className="w-44"
            onClick={async () => {
              await onDelete();
              ctrl.hide();
            }}
            aria-label={t("confirm_webhook_deletion")}
          >
            {t("delete")}
          </Button>
        </Space>
      );
    },
    style: { width: 512 },
  });
};
