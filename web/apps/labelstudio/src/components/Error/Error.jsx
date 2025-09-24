import { Fragment, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import sanitizeHtml from "sanitize-html";
import { IconSlack } from "@humansignal/icons";
import { Block, Elem } from "../../utils/bem";
import { absoluteURL, copyText } from "../../utils/helpers";
import { Button } from "@humansignal/ui";
import { Space } from "../Space/Space";
import "./Error.scss";

const SLACK_INVITE_URL = "https://slack.labelstud.io/?source=product-error-msg";

export const ErrorWrapper = ({
  title,
  message,
  errorId,
  stacktrace,
  validation,
  version,
  onGoBack,
  onReload,
  possum = false,
}) => {
  const { t } = useTranslation();
  const preparedStackTrace = useMemo(() => {
    return (stacktrace ?? "").trim();
  }, [stacktrace]);

  const [copied, setCopied] = useState(false);

  const copyStacktrace = useCallback(() => {
    setCopied(true);
    copyText(preparedStackTrace);
    setTimeout(() => setCopied(false), 1200);
  }, [preparedStackTrace]);

  return (
    <Block name="error-message">
      {possum !== false && (
        <Elem
          tag="img"
          name="heidi"
          src={absoluteURL("/static/images/opossum_broken.svg")}
          height="111"
          alt={t("heidis_down")}
        />
      )}

      {title && <Elem name="title">{title}</Elem>}

      {message && (
        <Elem
          name="detail"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(String(message)),
          }}
        />
      )}

      {preparedStackTrace && (
        <Elem
          name="stracktrace"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(preparedStackTrace.replace(/(\n)/g, "<br>")),
          }}
        />
      )}

      {validation?.length > 0 && (
        <Elem tag="ul" name="validation">
          {validation.map(([field, errors]) => (
            <Fragment key={field}>
              {[].concat(errors).map((err, i) => (
                <Elem tag="li" key={i} name="message" dangerouslySetInnerHTML={{ __html: sanitizeHtml(err) }} />
              ))}
            </Fragment>
          ))}
        </Elem>
      )}

      {(version || errorId) && (
        <Elem name="version">
          <Space>
            {version && `${t("version")}: ${version}`}
            {errorId && `${t("error_id")}: ${errorId}`}
          </Space>
        </Elem>
      )}

      <Elem name="actions">
        <Space spread>
          <Elem tag={Button} name="action-slack" target="_blank" icon={<IconSlack />} href={SLACK_INVITE_URL}>
            {t("ask_on_slack")}
          </Elem>

          <Space size="small">
            {preparedStackTrace && (
              <Button
                disabled={copied}
                onClick={copyStacktrace}
                className="w-[100px]"
                aria-label={t("copy_error_stacktrace")}
              >
                {copied ? t("copied") : t("copy_stacktrace")}
              </Button>
            )}
            {onGoBack && (
              <Button onClick={onGoBack} aria-label={t("go_back")}>
                {t("go_back")}
              </Button>
            )}
            {onReload && (
              <Button onClick={onReload} aria-label={t("reload_page")}>
                {t("reload")}
              </Button>
            )}
          </Space>
        </Space>
      </Elem>
    </Block>
  );
};
