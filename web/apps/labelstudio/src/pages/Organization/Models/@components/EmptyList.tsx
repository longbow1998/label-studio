import { Button } from "@humansignal/ui";
import { Block, Elem } from "apps/labelstudio/src/utils/bem";
import type { FC } from "react";
import "./EmptyList.scss";
import { HeidiAi } from "apps/labelstudio/src/assets/images";
import { useTranslation } from "react-i18next";

export const EmptyList: FC = () => {
  const { t } = useTranslation();
  return (
    <Block name="empty-models-list">
      <Elem name="content">
        <Elem name="heidy">
          <HeidiAi />
        </Elem>
        <Elem name="title">{t("create_model")}</Elem>
        <Elem name="caption">{t("build_high_quality_model")}</Elem>
        <Button aria-label={t("create_model")}>{t("create_model")}</Button>
      </Elem>
    </Block>
  );
};
