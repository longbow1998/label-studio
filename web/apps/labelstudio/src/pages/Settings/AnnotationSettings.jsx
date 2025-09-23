import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Button } from "@humansignal/ui";
import { Form, TextArea, Toggle } from "../../components/Form";
import { MenubarContext } from "../../components/Menubar/Menubar";
import { Block, Elem } from "../../utils/bem";
import { ModelVersionSelector } from "./AnnotationSettings/ModelVersionSelector";
import { ProjectContext } from "../../providers/ProjectProvider";
import { Divider } from "../../components/Divider/Divider";
import { useTranslation } from "react-i18next";

export const AnnotationSettings = () => {
  const { t } = useTranslation();
  const { project, fetchProject } = useContext(ProjectContext);
  const pageContext = useContext(MenubarContext);
  const formRef = useRef();
  const [collab, setCollab] = useState(null);

  useEffect(() => {
    pageContext.setProps({ formRef });
  }, [formRef]);

  useEffect(() => {
    AnnotationSettings.title = t("annotation");
  }, [t]);

  const updateProject = useCallback(() => {
    fetchProject(project.id, true);
  }, [project]);

  return (
    <Block name="annotation-settings">
      <Elem name={"wrapper"}>
        <h1>{t("annotation_settings")}</h1>
        <Block name="settings-wrapper">
          <Form
            ref={formRef}
            action="updateProject"
            formData={{ ...project }}
            params={{ pk: project.id }}
            onSubmit={updateProject}
          >
            <Form.Row columnCount={1}>
              <Elem name={"header"}>{t("labeling_instructions")}</Elem>
              <div class="settings-description">
                <p style={{ marginBottom: "0" }}>{t("labeling_instructions_desc1")}</p>
                <p style={{ marginTop: "8px" }}>
                  {t("labeling_instructions_desc2")}
                </p>
              </div>
              <div>
                <Toggle label={t("show_before_labeling")} name="show_instruction" />
              </div>
              <TextArea name="expert_instruction" style={{ minHeight: 128, maxWidth: "520px" }} />
            </Form.Row>

            <Divider height={32} />

            <Form.Row columnCount={1}>
              <br />
              <Elem name={"header"}>{t("prelabeling")}</Elem>
              <div>
                <Toggle
                  label={t("prelabeling_desc")}
                  description={<span>{t("prelabeling_desc_long")}</span>}
                  name="show_collab_predictions"
                  onChange={(e) => {
                    setCollab(e.target.checked);
                  }}
                />
              </div>

              {(collab !== null ? collab : project.show_collab_predictions) && <ModelVersionSelector />}
            </Form.Row>

            <Form.Actions>
              <Form.Indicator>
                <span case="success">{t("saved")}</span>
              </Form.Indicator>
              <Button type="submit" look="primary" className="w-[150px]" aria-label={t("save_annotation_settings")}>
                {t("save")}
              </Button>
            </Form.Actions>
          </Form>
        </Block>
      </Elem>
    </Block>
  );
};

AnnotationSettings.path = "/annotation";
