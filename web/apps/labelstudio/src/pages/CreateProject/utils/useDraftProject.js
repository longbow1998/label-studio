import { projectAtom } from "apps/labelstudio/src/providers/ProjectProvider";
import { useAtom } from "jotai";
import React, { useEffect } from "react";
import { useAPI } from "../../../providers/ApiProvider";
import { useTranslation } from "react-i18next";

export const useDraftProject = () => {
  const api = useAPI();
  const { t } = useTranslation();
  const [project, setProject] = useAtom(projectAtom);

  const fetchDraftProject = React.useCallback(async () => {
    const response = await api.callApi("projects");

    // always create the new one
    const projects = response?.results ?? [];
    const lastIndex = projects.length;
    let projectNumber = lastIndex + 1;
    let projectName = t("new_project_number", { number: projectNumber });

    // dirty hack to get proper non-duplicate name
    while (projects.find(({ title }) => title === projectName)) {
      projectNumber++;
      projectName = t("new_project_number", { number: projectNumber });
    }

    const draft = await api.callApi("createProject", {
      body: {
        title: projectName,
      },
    });
    console.log({ draft });

    if (draft) setProject(draft);
  }, []);

  useEffect(() => {
    fetchDraftProject();
  }, []);

  return { project, setProject };
};
