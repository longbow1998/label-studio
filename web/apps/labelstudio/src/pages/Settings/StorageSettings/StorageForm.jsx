import { forwardRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@humansignal/ui";
import { InlineError } from "../../../components/Error/InlineError";
import { Form, Input } from "../../../components/Form";
import { Oneof } from "../../../components/Oneof/Oneof";
import { ApiContext } from "../../../providers/ApiProvider";
import { Block, Elem } from "../../../utils/bem";
import { isDefined } from "../../../utils/helpers";
import { useTranslation } from "react-i18next";

export const StorageForm = forwardRef(({ onSubmit, target, project, rootClass, storage, storageTypes }, ref) => {
  const { t } = useTranslation();
  const api = useContext(ApiContext);
  const formRef = ref ?? useRef();
  const [type, setType] = useState(storage?.type ?? storageTypes?.[0]?.name ?? "s3");
  const [checking, setChecking] = useState(false);
  const [connectionValid, setConnectionValid] = useState(null);
  const [formFields, setFormFields] = useState([]);

  useEffect(() => {
    api
      .callApi("storageForms", {
        params: {
          target,
          type,
        },
      })
      .then((formFields) => setFormFields(formFields ?? []));
  }, [type]);

  const storageTypeSelect = {
    columnCount: 1,
    fields: [
      {
        skip: true,
        type: "select",
        name: "storage_type",
        label: t("storage_type"),
        disabled: !!storage,
        options: storageTypes.map(({ name, title }) => ({
          value: name,
          label: title,
        })),
        value: storage?.type ?? type,
        onChange: setType,
      },
    ],
  };

  const validateStorageConnection = useCallback(async () => {
    setChecking(true);
    setConnectionValid(null);

    const form = formRef.current;

    if (form && form.validateFields()) {
      const body = form.assembleFormData({ asJSON: true });
      const type = form.getField("storage_type").value;

      if (isDefined(storage?.id)) {
        body.id = storage.id;
      }

      const response = await form.api.callApi("validateStorage", {
        params: {
          target,
          type,
        },
        body,
      });

      if (response?.$meta?.ok) setConnectionValid(true);
      else setConnectionValid(false);
    }
    setChecking(false);
  }, [formRef, target, type, storage]);

  const action = useMemo(() => {
    return storage ? "updateStorage" : "createStorage";
  }, [storage]);

  return (
    <Form.Builder
      ref={formRef}
      action={action}
      params={{ target, type, project, pk: storage?.id }}
      fields={[storageTypeSelect, ...(formFields ?? [])]}
      formData={{ ...(storage ?? {}) }}
      skipEmpty={false}
      onSubmit={onSubmit}
      autoFill="off"
      autoComplete="off"
    >
      <Input type="hidden" name="project" value={project} />
      <Form.Actions
        valid={connectionValid}
        extra={
          connectionValid !== null && (
            <Block name="form-indicator">
              <Oneof value={connectionValid}>
                <Elem tag="span" mod={{ type: "success" }} name="item" case={true}>
                  {t("successfully_connected")}
                </Elem>
                <Elem tag="span" mod={{ type: "fail" }} name="item" case={false}>
                  {t("connection_failed")}
                </Elem>
              </Oneof>
            </Block>
          )
        }
      >
        <Input type="hidden" name="project" value={project} />
        <div className="flex gap-tight">
          <Button
            type="button"
            look="outlined"
            waiting={checking}
            onClick={validateStorageConnection}
            aria-label={t("test_storage_connection")}
          >
            {t("check_connection")}
          </Button>
          <Button type="submit" aria-label={storage ? t("save_storage_settings") : t("add_storage")}>
            {storage ? t("save") : t("add_storage")}
          </Button>
        </div>
      </Form.Actions>

      <InlineError />
    </Form.Builder>
  );
});
