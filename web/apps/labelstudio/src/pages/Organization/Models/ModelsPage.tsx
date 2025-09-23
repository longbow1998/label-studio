import { buttonVariant, Space } from "@humansignal/ui";
import { Block } from "apps/labelstudio/src/utils/bem";
import { Link } from "react-router-dom";
import type { Page } from "../../types/Page";
import { EmptyList } from "./@components/EmptyList";
import { useTranslation } from "react-i18next";

export const ModelsPage: Page = () => {
  return (
    <Block name="prompter">
      <EmptyList />
    </Block>
  );
};

ModelsPage.title = "models";
ModelsPage.titleRaw = "models";
ModelsPage.path = "/models";

const Context = () => {
  const { t } = useTranslation();
  return (
    <Space size="small">
      <Link to="/prompt/settings" className={buttonVariant({ size: "small" })}>
        {t("create_model")}
      </Link>
    </Space>
  );
};

ModelsPage.context = Context;
