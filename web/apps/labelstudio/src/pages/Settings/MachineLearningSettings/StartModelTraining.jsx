import { useCallback, useState } from "react";
import { Button } from "@humansignal/ui";
import { useAPI } from "../../../providers/ApiProvider";
import { Typography } from "@humansignal/ui";
import { useTranslation } from "react-i18next";

export const StartModelTraining = ({ backend }) => {
  const { t } = useTranslation();
  const api = useAPI();
  const [response, setResponse] = useState(null);

  const onStartTraining = useCallback(
    async (backend) => {
      const res = await api.callApi("trainMLBackend", {
        params: {
          pk: backend.id,
        },
      });

      setResponse(res.response || {});
    },
    [api],
  );

  return (
    <div className="max-w-[680px]">
      <Typography size="small" className="text-neutral-content-subtler">
        {t("start_model_training_desc")}
      </Typography>
      <Typography size="small" className="text-neutral-content-subtler mt-base mb-wide">
        {t("start_model_training_note")}
      </Typography>

      {!response && (
        <Button
          onClick={() => {
            onStartTraining(backend);
          }}
        >
          {t("start_training")}
        </Button>
      )}

      {!!response && (
        <>
          <pre>{t("request_sent")}</pre>
          <pre>
            {t("response")}: {JSON.stringify(response, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
};
