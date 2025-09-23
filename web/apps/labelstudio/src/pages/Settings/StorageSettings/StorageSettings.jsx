import { cn } from "../../../utils/bem";
import { StorageSet } from "./StorageSet";
import { isInLicense, LF_CLOUD_STORAGE_FOR_MANAGERS } from "../../../utils/license-flags";
import { Typography } from "@humansignal/ui";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

const isAllowCloudStorage = !isInLicense(LF_CLOUD_STORAGE_FOR_MANAGERS);

export const StorageSettings = () => {
  const { t } = useTranslation();
  const rootClass = cn("storage-settings"); // TODO: Remove in the next BEM cleanup

  useEffect(() => {
    StorageSettings.title = t("cloud_storage");
  }, [t]);

  return isAllowCloudStorage ? (
    <section className="max-w-[680px]">
      <Typography variant="headline" size="medium" className="mb-base">
        {t("cloud_storage")}
      </Typography>
      <Typography size="small" className="text-neutral-content-subtler mb-wider">
        {t("cloud_storage_desc")}
      </Typography>

      <div className="grid grid-cols-2 gap-8">
        <StorageSet title={t("source_cloud_storage")} buttonLabel={t("add_source_storage")} rootClass={rootClass} />

        <StorageSet
          title={t("target_cloud_storage")}
          target="export"
          buttonLabel={t("add_target_storage")}
          rootClass={rootClass}
        />
      </div>
    </section>
  ) : null;
};

StorageSettings.path = "/storage";
