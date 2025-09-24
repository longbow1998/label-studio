import { format } from "date-fns/esm";
import { Button, CodeBlock, IconFileCopy, Space, Tooltip } from "@humansignal/ui";
import { DescriptionList } from "../../../components/DescriptionList/DescriptionList";
import { modal } from "../../../components/Modal/Modal";
import { Oneof } from "../../../components/Oneof/Oneof";
import { getLastTraceback } from "../../../utils/helpers";
import { useCopyText } from "@humansignal/core/lib/hooks/useCopyText";
import { useTranslation } from "react-i18next";

// Component to handle copy functionality within the modal
const CopyButton = ({ msg }) => {
  const { t } = useTranslation();
  const [copyText, copied] = useCopyText(msg);

  return (
    <Button variant="neutral" icon={<IconFileCopy />} onClick={copyText} disabled={copied} className="w-[7rem]">
      {copied ? t("copied") : t("copy")}
    </Button>
  );
};

export const StorageSummary = ({ target, storage, className, storageTypes = [] }) => {
  const { t } = useTranslation();
  const storageStatus = storage.status.replace(/_/g, " ").replace(/(^\w)/, (match) => match.toUpperCase());
  const last_sync_count = storage.last_sync_count ? storage.last_sync_count : 0;

  const tasks_existed =
    typeof storage.meta?.tasks_existed !== "undefined" && storage.meta?.tasks_existed !== null
      ? storage.meta.tasks_existed
      : 0;
  const total_annotations =
    typeof storage.meta?.total_annotations !== "undefined" && storage.meta?.total_annotations !== null
      ? storage.meta.total_annotations
      : 0;

  // help text for tasks and annotations
  const tasks_added_help = t("tasks_added_help", { count: last_sync_count });
  const tasks_total_help = [
    t("tasks_total_help_1", { count: tasks_existed }),
    t("tasks_total_help_2", { count: tasks_existed + last_sync_count }),
  ].join("\n");
  const annotations_help = t("annotations_help", { count: last_sync_count });
  const total_annotations_help =
    typeof storage.meta?.total_annotations !== "undefined"
      ? t("total_annotations_help", { count: storage.meta.total_annotations })
      : "";

  const handleButtonClick = () => {
    const msg =
      t("error_log_message", {
        target: target === "export" ? t("export") : "",
        type: storage.type,
        id: storage.id,
        project: storage.project,
        job: storage.last_sync_job,
        traceback: getLastTraceback(storage.traceback),
        meta: JSON.stringify(storage.meta),
      }) + "\n";

    const currentModal = modal({
      title: t("storage_sync_error_log"),
      body: <CodeBlock code={msg} variant="negative" className="max-h-[50vh] overflow-y-auto" />,
      footer: (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {!window.APP_SETTINGS?.whitelabel_is_active && (
            <div>
              <>
                <a
                  href="https://labelstud.io/guide/storage.html#Troubleshooting"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={t("learn_more_troubleshooting")}
                >
                  {t("see_docs")}
                </a>{" "}
                {t("troubleshooting_tips")}
              </>
            </div>
          )}
          <Space>
            <CopyButton msg={msg} />
            <Button variant="primary" className="w-[7rem]" onClick={() => currentModal.close()}>
              {t("close")}
            </Button>
          </Space>
        </div>
      ),
      style: { width: "700px" },
      optimize: false,
      allowClose: true,
    });
  };

  return (
    <div className={className}>
      <DescriptionList>
        <DescriptionList.Item term={t("type")}>
          {(storageTypes ?? []).find((s) => s.name === storage.type)?.title ?? storage.type}
        </DescriptionList.Item>

        <Oneof value={storage.type}>
          <SummaryS3 case={["s3", "s3s"]} storage={storage} />
          <GSCStorage case="gcs" storage={storage} />
          <AzureStorage case="azure" storage={storage} />
          <RedisStorage case="redis" storage={storage} />
          <LocalStorage case="localfiles" storage={storage} />
        </Oneof>

        <DescriptionList.Item
          term={t("status")}
          help={[
            t("status_initialized_desc"),
            t("status_queued_desc"),
            t("status_in_progress_desc"),
            t("status_failed_desc"),
            t("status_completed_desc"),
          ].join("\n")}
        >
          {storageStatus === "Failed" ? (
            <span
              className="cursor-pointer border-b border-dashed border-negative-border-subtle text-negative-content"
              onClick={handleButtonClick}
            >
              {t("failed_view_logs")}
            </span>
          ) : (
            storageStatus
          )}
        </DescriptionList.Item>

        {target === "export" ? (
          <DescriptionList.Item term={t("annotations")} help={`${annotations_help}\n${total_annotations_help}`}>
            <Tooltip title={annotations_help}>
              <span>{last_sync_count}</span>
            </Tooltip>
            <Tooltip title={total_annotations_help}>
              <span>
                {" "}
                ({t("total_annotations", { count: total_annotations })})
              </span>
            </Tooltip>
          </DescriptionList.Item>
        ) : (
          <DescriptionList.Item term={t("tasks")} help={`${tasks_added_help}\n${tasks_total_help}`}>
            <Tooltip title={`${tasks_added_help}\n${tasks_total_help}`} style={{ whiteSpace: "pre-wrap" }}>
              <span>{last_sync_count + tasks_existed}</span>
            </Tooltip>
            <Tooltip title={tasks_added_help}>
              <span>
                {" "}
                ({t("new_tasks", { count: last_sync_count })})
              </span>
            </Tooltip>
          </DescriptionList.Item>
        )}

        <DescriptionList.Item term={t("last_sync")}>
          {storage.last_sync
            ? format(new Date(storage.last_sync), "MMMM dd, yyyy ∙ HH:mm:ss")
            : t("not_synced_yet")}
        </DescriptionList.Item>
      </DescriptionList>
    </div>
  );
};

const SummaryS3 = ({ storage }) => {
  const { t } = useTranslation();
  return <DescriptionList.Item term={t("bucket")}>{storage.bucket}</DescriptionList.Item>;
};

const GSCStorage = ({ storage }) => {
  const { t } = useTranslation();
  return <DescriptionList.Item term={t("bucket")}>{storage.bucket}</DescriptionList.Item>;
};

const AzureStorage = ({ storage }) => {
  const { t } = useTranslation();
  return <DescriptionList.Item term={t("container")}>{storage.container}</DescriptionList.Item>;
};

const RedisStorage = ({ storage }) => {
  const { t } = useTranslation();
  return (
    <>
      <DescriptionList.Item term={t("path")}>{storage.path}</DescriptionList.Item>
      <DescriptionList.Item term={t("host")}>
        {storage.host}
        {storage.port ? `:${storage.port}` : ""}
      </DescriptionList.Item>
    </>
  );
};

const LocalStorage = ({ storage }) => {
  const { t } = useTranslation();
  return <DescriptionList.Item term={t("path")}>{storage.path}</DescriptionList.Item>;
};
