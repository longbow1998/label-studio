import { useCallback, useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Button, Typography, Spinner } from "@humansignal/ui";
import { Form, Label, Toggle } from "../../../components/Form";
import { modal } from "../../../components/Modal/Modal";
import { EmptyState } from "../../../components/EmptyState/EmptyState";
import { IconModels } from "@humansignal/icons";
import { useAPI } from "../../../providers/ApiProvider";
import { ProjectContext } from "../../../providers/ProjectProvider";
import { MachineLearningList } from "./MachineLearningList";
import { CustomBackendForm } from "./Forms";
import { TestRequest } from "./TestRequest";
import { StartModelTraining } from "./StartModelTraining";
import "./MachineLearningSettings.scss";
import { useTranslation } from "react-i18next";

export const MachineLearningSettings = () => {
  const { t } = useTranslation();
  const api = useAPI();
  const { project, fetchProject } = useContext(ProjectContext);
  const [backends, setBackends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    MachineLearningSettings.title = t("model");
  }, [t]);

  const fetchBackends = useCallback(async () => {
    setLoading(true);
    const models = await api.callApi("mlBackends", {
      params: {
        project: project.id,
        include_static: true,
      },
    });

    if (models) setBackends(models);
    setLoading(false);
    setLoaded(true);
  }, [project, setBackends]);

  const startTrainingModal = useCallback(
    (backend) => {
      const modalProps = {
        title: t("start_model_training"),
        style: { width: 760 },
        closeOnClickOutside: true,
        body: <StartModelTraining backend={backend} />,
      };

      modal(modalProps);
    },
    [project, t],
  );

  const showRequestModal = useCallback(
    (backend) => {
      const modalProps = {
        title: t("test_request"),
        style: { width: 760 },
        closeOnClickOutside: true,
        body: <TestRequest backend={backend} />,
      };

      modal(modalProps);
    },
    [project, t],
  );

  const showMLFormModal = useCallback(
    (backend) => {
      const action = backend ? "updateMLBackend" : "addMLBackend";
      const modalProps = {
        title: `${backend ? t("edit_model") : t("connect_model")} `,
        style: { width: 760 },
        closeOnClickOutside: false,
        body: (
          <CustomBackendForm
            action={action}
            backend={backend}
            project={project}
            onSubmit={() => {
              fetchBackends();
              modalRef.close();
            }}
          />
        ),
      };

      const modalRef = modal(modalProps);
    },
    [project, fetchBackends, t],
  );

  useEffect(() => {
    if (project.id) {
      fetchBackends();
    }
  }, [project.id]);

  return (
    <section>
      <div className="w-[40rem]">
        <Typography variant="headline" size="medium" className="mb-base">
          {t("model")}
        </Typography>
        {loading && <Spinner size={32} />}
        {loaded && backends.length === 0 && (
          <EmptyState
            icon={<IconModels />}
            title={t("connect_first_model")}
            description={t("connect_first_model_desc")}
            action={
              <Button primary onClick={() => showMLFormModal()} aria-label={t("add_ml_model")}>
                {t("connect_model")}
              </Button>
            }
            footer={
              <div>
                {t("need_help")}
                <br />
                <a href="https://labelstud.io/guide/ml" target="_blank" rel="noreferrer">
                  {t("learn_more_models")}
                </a>
              </div>
            }
          />
        )}
        <MachineLearningList
          onEdit={(backend) => showMLFormModal(backend)}
          onTestRequest={(backend) => showRequestModal(backend)}
          onStartTraining={(backend) => startTrainingModal(backend)}
          fetchBackends={fetchBackends}
          backends={backends}
        />

        {backends.length > 0 && (
          <div className="my-wide">
            <Typography size="small" className="text-neutral-content-subtler">
              {t("connected_model_detected")}
            </Typography>
            <Typography size="small" className="text-neutral-content-subtler mt-base" dangerouslySetInnerHTML={{ __html: t("navigate_to_dm") }} />
            <Typography size="small" className="text-neutral-content-subtler mt-tighter">
              {t("select_desired_tasks")}
            </Typography>
            <Typography size="small" className="text-neutral-content-subtler mt-tighter" dangerouslySetInnerHTML={{ __html: t("click_batch_predictions") }}/>
            <Typography size="small" className="text-neutral-content-subtler mt-base">
              {t("model_prelabeling_info")} {" "}
              <NavLink to="annotation" className="hover:underline">
                {t("annotation_settings")}
              </NavLink>
              .
            </Typography>
          </div>
        )}

        <Form
          action="updateProject"
          formData={{ ...project }}
          params={{ pk: project.id }}
          onSubmit={() => fetchProject()}
        >
          {backends.length > 0 && (
            <div className="p-wide border border-neutral-border rounded-md">
              <Form.Row columnCount={1}>
                <Label text={t("configuration")} large />

                <div>
                  <Toggle
                    label={t("start_model_training_on_submission")}
                    description={t("start_model_training_on_submission_desc")}
                    name="start_training_on_annotation_update"
                  />
                </div>
              </Form.Row>
            </div>
          )}

          {backends.length > 0 && (
            <Form.Actions>
              <Form.Indicator>
                <span case="success">{t("saved")}</span>
              </Form.Indicator>
              <Button type="submit" look="primary" className="w-[120px]" aria-label={t("save_ml_settings")}>
                {t("save")}
              </Button>
            </Form.Actions>
          )}
        </Form>
      </div>
    </section>
  );
};

MachineLearningSettings.path = "/ml";
