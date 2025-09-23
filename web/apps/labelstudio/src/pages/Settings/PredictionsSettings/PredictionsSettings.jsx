import { useCallback, useContext, useEffect, useState } from "react";
import { Divider } from "../../../components/Divider/Divider";
import { EmptyState } from "../../../components/EmptyState/EmptyState";
import { IconPredictions, Typography } from "@humansignal/ui";
import { useAPI } from "../../../providers/ApiProvider";
import { ProjectContext } from "../../../providers/ProjectProvider";
import { Spinner } from "../../../components/Spinner/Spinner";
import { PredictionsList } from "./PredictionsList";
import { useTranslation } from "react-i18next";

export const PredictionsSettings = () => {
  const { t } = useTranslation();
  const api = useAPI();
  const { project } = useContext(ProjectContext);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    PredictionsSettings.title = t("predictions");
  }, [t]);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    const versions = await api.callApi("projectModelVersions", {
      params: {
        pk: project.id,
        extended: true,
      },
    });

    if (versions) setVersions(versions.static);
    setLoading(false);
    setLoaded(true);
  }, [project, setVersions]);

  useEffect(() => {
    if (project.id) {
      fetchVersions();
    }
  }, [project]);

  return (
    <section className="max-w-[42rem]">
      <Typography variant="headline" size="medium" className="mb-tight">
        {t("predictions")}
      </Typography>
      <div>
        {loading && <Spinner size={32} />}

        {loaded && versions.length > 0 && (
          <>
            <Typography variant="title" size="medium">
              {t("predictions_list")}
            </Typography>
            <Typography size="small" className="text-neutral-content-subtler mt-base mb-wider">
              {t("predictions_list_desc")}
            </Typography>
          </>
        )}

        {loaded && versions.length === 0 && (
          <EmptyState
            icon={<IconPredictions />}
            title={t("no_predictions_uploaded")}
            description={t("no_predictions_uploaded_desc")}
            footer={
              <div>
                {t("need_help")}
                <br />
                <a href="https://labelstud.io/guide/predictions" target="_blank" rel="noreferrer">
                  {t("learn_more_predictions")}
                </a>
              </div>
            }
          />
        )}

        <PredictionsList project={project} versions={versions} fetchVersions={fetchVersions} />

        <Divider height={32} />
      </div>
    </section>
  );
};

PredictionsSettings.path = "/predictions";
