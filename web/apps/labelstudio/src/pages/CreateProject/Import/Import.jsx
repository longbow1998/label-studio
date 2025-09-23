import { SampleDatasetSelect } from "@humansignal/app-common/blocks/SampleDatasetSelect/SampleDatasetSelect";
import { ff } from "@humansignal/core";
import { IconCode, IconErrorAlt, IconFileUpload, IconInfoOutline, IconTrash, IconUpload } from "@humansignal/icons";
import { Badge } from "@humansignal/shad/components/ui/badge";
import { cn as scn } from "@humansignal/shad/utils";
import { useAtomValue } from "jotai";
import Input from "libs/datamanager/src/components/Common/Input/Input";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useAPI } from "../../../providers/ApiProvider";
import { cn } from "../../../utils/bem";
import { unique } from "../../../utils/helpers";
import { sampleDatasetAtom } from "../utils/atoms";
import "./Import.scss";
import { Button, CodeBlock, SimpleCard, Spinner, Tooltip } from "@humansignal/ui";
import samples from "./samples.json";
import { importFiles } from "./utils";
import { useTranslation } from "react-i18next";

const importClass = cn("upload_page");
const dropzoneClass = cn("dropzone");

function flatten(nested) {
  return [].concat(...nested);
}

// Keep in sync with core.settings.SUPPORTED_EXTENSIONS on the BE.
const supportedExtensions = {
  text: ["txt"],
  audio: ["wav", "mp3", "flac", "m4a", "ogg"],
  video: ["mp4", "webm"],
  image: ["bmp", "gif", "jpg", "jpeg", "png", "svg", "webp"],
  html: ["html", "htm", "xml"],
  pdf: ["pdf"],
  structuredData: ["csv", "tsv", "json"],
};
const allSupportedExtensions = flatten(Object.values(supportedExtensions));

function getFileExtension(fileName) {
  if (!fileName) {
    return fileName;
  }
  return fileName.split(".").pop().toLowerCase();
}

function traverseFileTree(item, path) {
  return new Promise((resolve) => {
    path = path || "";
    if (item.isFile) {
      // Avoid hidden files
      if (item.name[0] === ".") return resolve([]);

      resolve([item]);
    } else if (item.isDirectory) {
      // Get folder contents
      const dirReader = item.createReader();
      const dirPath = `${path + item.name}/`;

      dirReader.readEntries((entries) => {
        Promise.all(entries.map((entry) => traverseFileTree(entry, dirPath)))
          .then(flatten)
          .then(resolve);
      });
    }
  });
}

function getFiles(files) {
  // @todo this can be not a files, but text or any other draggable stuff
  return new Promise((resolve) => {
    if (!files.length) return resolve([]);
    if (!files[0].webkitGetAsEntry) return resolve(files);

    // Use DataTransferItemList interface to access the file(s)
    const entries = Array.from(files).map((file) => file.webkitGetAsEntry());

    Promise.all(entries.map(traverseFileTree))
      .then(flatten)
      .then((fileEntries) => fileEntries.map((fileEntry) => new Promise((res) => fileEntry.file(res))))
      .then((filePromises) => Promise.all(filePromises))
      .then(resolve);
  });
}

const Upload = ({ children, sendFiles }) => {
  const [hovered, setHovered] = useState(false);
  const onHover = (e) => {
    e.preventDefault();
    setHovered(true);
  };
  const onLeave = setHovered.bind(null, false);
  const dropzoneRef = useRef();

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      onLeave();
      getFiles(e.dataTransfer.items).then((files) => sendFiles(files));
    },
    [onLeave, sendFiles],
  );

  return (
    <div
      id="holder"
      className={dropzoneClass.mod({ hovered })}
      ref={dropzoneRef}
      onDragStart={onHover}
      onDragOver={onHover}
      onDragLeave={onLeave}
      onDrop={onDrop}
      // {...getRootProps}
    >
      {children}
    </div>
  );
};

const ErrorMessage = ({ error }) => {
  if (!error) return null;
  let extra = error.validation_errors ?? error.extra;
  // support all possible responses

  if (extra && typeof extra === "object" && !Array.isArray(extra)) {
    extra = extra.non_field_errors ?? Object.values(extra);
  }
  if (Array.isArray(extra)) extra = extra.join("; ");

  return (
    <div className={importClass.elem("error")}>
      <IconErrorAlt width="24" height="24" />
      {error.id && `[${error.id}] `}
      {error.detail || error.message}
      {extra && ` (${extra})`}
    </div>
  );
};

export const ImportPage = ({
  project,
  sample,
  show = true,
  onWaiting,
  onFileListUpdate,
  onSampleDatasetSelect,
  highlightCsvHandling,
  dontCommitToProject = false,
  csvHandling,
  setCsvHandling,
  addColumns,
  openLabelingConfig,
}) => {
  const { t } = useTranslation();
  const [error, setError] = useState();
  const api = useAPI();
  const projectConfigured = project?.label_config !== "<View></View>";
  const sampleConfig = useAtomValue(sampleDatasetAtom);

  const processFiles = (state, action) => {
    if (action.sending) {
      return { ...state, uploading: [...action.sending, ...state.uploading] };
    }
    if (action.sent) {
      return {
        ...state,
        uploading: state.uploading.filter((f) => !action.sent.includes(f)),
      };
    }
    if (action.uploaded) {
      return {
        ...state,
        uploaded: unique([...state.uploaded, ...action.uploaded], (a, b) => a.id === b.id),
      };
    }
    if (action.ids) {
      const ids = unique([...state.ids, ...action.ids]);

      onFileListUpdate?.(ids);
      return { ...state, ids };
    }
    return state;
  };

  const [files, dispatch] = useReducer(processFiles, {
    uploaded: [],
    uploading: [],
    ids: [],
  });
  const showList = Boolean(files.uploaded?.length || files.uploading?.length || sample);

  const loadFilesList = useCallback(
    async (file_upload_ids) => {
      const query = {};

      if (file_upload_ids) {
        // should be stringified array "[1,2]"
        query.ids = JSON.stringify(file_upload_ids);
      }
      const files = await api.callApi("fileUploads", {
        params: { pk: project.id, ...query },
      });

      dispatch({ uploaded: files ?? [] });

      if (files?.length) {
        dispatch({ ids: files.map((f) => f.id) });
      }
      return files;
    },
    [project?.id],
  );

  const onError = (err) => {
    console.error(err);
    // @todo workaround for error about input size in a wrong html format
    if (typeof err === "string" && err.includes("RequestDataTooBig")) {
      const message = t("imported_file_is_too_big");
      const extra = err.match(/"exception_value">(.*)<\/pre>/)?.[1];

      err = { message, extra };
    }
    setError(err);
    onWaiting?.(false);
  };
  const onFinish = useCallback(
    async (res) => {
      const { could_be_tasks_list, data_columns, file_upload_ids } = res;

      dispatch({ ids: file_upload_ids });
      if (could_be_tasks_list && !csvHandling) setCsvHandling("choose");
      onWaiting?.(false);
      addColumns(data_columns);

      return loadFilesList(file_upload_ids);
    },
    [addColumns, loadFilesList],
  );

  const importFilesImmediately = useCallback(
    async (files, body) => {
      importFiles({
        files,
        body,
        project,
        onError,
        onFinish,
        onUploadStart: (files) => dispatch({ sending: files }),
        onUploadFinish: (files) => dispatch({ sent: files }),
        dontCommitToProject,
      });
    },
    [project, onFinish],
  );

  const sendFiles = useCallback(
    (files) => {
      setError(null);
      onWaiting?.(true);
      files = [...files]; // they can be array-like object
      const fd = new FormData();

      for (const f of files) {
        if (!allSupportedExtensions.includes(getFileExtension(f.name))) {
          onError(new Error(t("unsupported_file_type", { filename: f.name })));
          return;
        }
        fd.append(f.name, f);
      }
      return importFilesImmediately(files, fd);
    },
    [importFilesImmediately],
  );

  const onUpload = useCallback(
    (e) => {
      sendFiles(e.target.files);
      e.target.value = "";
    },
    [sendFiles],
  );

  const onLoadURL = useCallback(
    (e) => {
      e.preventDefault();
      setError(null);
      const url = urlRef.current?.value;

      if (!url) {
        return;
      }
      urlRef.current.value = "";
      onWaiting?.(true);
      const body = new URLSearchParams({ url });

      importFilesImmediately([{ name: url }], body);
    },
    [importFilesImmediately],
  );

  const openConfig = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLabelingConfig?.();
    },
    [openLabelingConfig],
  );

  useEffect(() => {
    if (project?.id !== undefined) {
      loadFilesList().then((files) => {
        if (csvHandling) return;
        // empirical guess on start if we have some possible tasks list/structured data problem
        if (Array.isArray(files) && files.some(({ file }) => /\.[ct]sv$/.test(file))) {
          setCsvHandling("choose");
        }
      });
    }
  }, [project?.id, loadFilesList]);

  const urlRef = useRef();

  if (!project) return null;
  if (!show) return null;

  const csvProps = {
    name: "csv",
    type: "radio",
    onChange: (e) => setCsvHandling(e.target.value),
  };

  return (
    <div className={importClass}>
      {highlightCsvHandling && <div className={importClass.elem("csv-splash")} />}
      <input id="file-input" type="file" name="file" multiple onChange={onUpload} style={{ display: "none" }} />

      <header className="flex gap-4">
        <form
          className={`${importClass.elem("url-form")} inline-flex items-stretch`}
          method="POST"
          onSubmit={onLoadURL}
        >
          <Input placeholder={t("dataset_url")} name="url" ref={urlRef} rawClassName="h-[40px]" />
          <Button variant="primary" look="outlined" type="submit" aria-label={t("add_url")}>
            {t("add_url")}
          </Button>
        </form>
        <span>{t("or")}</span>
        <Button
          variant="primary"
          look="outlined"
          type="button"
          onClick={() => document.getElementById("file-input").click()}
          leading={<IconUpload />}
          aria-label={t("upload_file")}
        >
          {files.uploaded.length ? t("upload_more_files") : t("upload_files")}
        </Button>
        {ff.isActive(ff.FF_SAMPLE_DATASETS) && (
          <SampleDatasetSelect samples={samples} sample={sample} onSampleApplied={onSampleDatasetSelect} />
        )}
        <div
          className={importClass.elem("csv-handling").mod({ highlighted: highlightCsvHandling, hidden: !csvHandling })}
        >
          <span>{t("treat_csv_as")}</span>
          <label>
            <input {...csvProps} value="tasks" checked={csvHandling === "tasks"} /> {t("list_of_tasks")}
          </label>
          <label>
            <input {...csvProps} value="ts" checked={csvHandling === "ts"} /> {t("time_series_or_whole_text_file")}
          </label>
        </div>
        <div className={importClass.elem("status")}>
          {files.uploaded.length ? t("files_uploaded", { count: files.uploaded.length }) : ""}
        </div>
      </header>

      <ErrorMessage error={error} />

      <main>
        <Upload sendFiles={sendFiles} project={project}>
          <div
            className={scn("flex gap-4 w-full min-h-full", {
              "justify-center": !showList,
            })}
          >
            {!showList && (
              <div className="flex gap-4 justify-center items-start w-full h-full">
                <label htmlFor="file-input" className="w-full h-full">
                  <div className={`${dropzoneClass.elem("content")} w-full`}>
                    <IconFileUpload height="64" className={dropzoneClass.elem("icon")} />
                    <header>
                      {t("drag_and_drop_files")}
                      <br />
                      {t("or_click_to_browse")}
                    </header>

                    <dl>
                      <dt>{t("images")}</dt>
                      <dd>{supportedExtensions.image.join(", ")}</dd>
                      <dt>{t("audio")}</dt>
                      <dd>{supportedExtensions.audio.join(", ")}</dd>
                      <dt>
                        <div className="flex items-center gap-1">
                          {t("video")}
                          <Tooltip title={t("video_format_support_depends_on_your_browser")}>
                            <a
                              href="https://labelstud.io/tags/video#Video-format"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center"
                              aria-label={t("learn_more_about_video_format_support")}
                            >
                              <IconInfoOutline className="w-4 h-4 text-primary-content hover:text-primary-content-hover" />
                            </a>
                          </Tooltip>
                        </div>
                      </dt>
                      <dd>{supportedExtensions.video.join(", ")}</dd>
                      <dt>{t("html_hypertext")}</dt>
                      <dd>{supportedExtensions.html.join(", ")}</dd>
                      <dt>{t("text")}</dt>
                      <dd>{supportedExtensions.text.join(", ")}</dd>
                      <dt>{t("structured_data")}</dt>
                      <dd>{supportedExtensions.structuredData.join(", ")}</dd>
                      <dt>{t("pdf")}</dt>
                      <dd>{supportedExtensions.pdf.join(", ")}</dd>
                    </dl>
                    <div className="tips">
                      <b>{t("important")}</b>
                      <ul className="mt-2 ml-4 list-disc font-normal">
                        <li
                          dangerouslySetInnerHTML={{
                            __html: t("we_recommend_cloud_storage", {
                              cloud_storage_link: `
                                <a
                                  href=\"https://labelstud.io/guide/storage.html\"
                                  target=\"_blank\"
                                  rel=\"noopener noreferrer\"
                                  aria-label=\"Cloud Storage documentation (opens in a new tab)\"
                                >
                                  ${t("cloud_storage_docs")}
                                </a>
                              `,
                              upload_limitations_link: `
                                <a
                                  href=\"https://labelstud.io/guide/tasks.html#Import-data-from-the-Label-Studio-UI\"
                                  target=\"_blank\"
                                  rel=\"noopener noreferrer\"
                                  aria-label=\"Upload limitations documentation (opens in a new tab)\"
                                >
                                  ${t("upload_limitations_docs")}
                                </a>
                              `,
                            }),
                          }}
                        />
                        <li
                          dangerouslySetInnerHTML={{
                            __html: t("for_pdfs_use_multi_image_labeling", {
                              multi_image_labeling_link: `
                                <a
                                  href=\"https://labelstud.io/templates/multi-page-document-annotation\"
                                  target=\"_blank\"
                                  rel=\"noopener noreferrer\"
                                  aria-label=\"Multi-image labeling documentation (opens in a new tab)\"
                                >
                                  ${t("multi_image_labeling_docs")}
                                </a>
                              `,
                            }),
                          }}
                        />
                        <li
                          dangerouslySetInnerHTML={{
                            __html: t("check_the_documentation_to_import_preannotated_data", {
                              import_preannotated_data_link: `
                                <a target=\"_blank\" href=\"https://labelstud.io/guide/predictions.html\" rel=\"noreferrer\">
                                  ${t("import_preannotated_data_docs")}
                                </a>
                              `,
                            }),
                          }}
                        />
                      </ul>
                    </div>
                  </div>
                </label>
              </div>
            )}

            {showList && (
              <div className="w-full">
                <SimpleCard title={t("files")} className="w-full h-full">
                  <table>
                    <tbody>
                      {sample && (
                        <tr key={sample.url}>
                          <td>
                            <div className="flex items-center gap-2">
                              {sample.title}
                              <Badge variant="info" className="h-5 text-xs rounded-sm">
                                {t("sample")}
                              </Badge>
                            </div>
                          </td>
                          <td>{sample.description}</td>
                          <td>
                            <Button size="smaller" variant="negative" onClick={() => onSampleDatasetSelect(undefined)}>
                              <IconTrash className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      )}
                      {files.uploading.map((file, idx) => (
                        <tr key={`${idx}-${file.name}`}>
                          <td>{file.name}</td>
                          <td colSpan={2}>
                            <span className={importClass.elem("file-status").mod({ uploading: true })} />
                          </td>
                        </tr>
                      ))}
                      {files.uploaded.map((file) => (
                        <tr key={file.file}>
                          <td>{file.file}</td>
                          <td>
                            <span className={importClass.elem("file-status")} />
                          </td>
                          <td>{file.size}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </SimpleCard>
              </div>
            )}

            {ff.isFF(ff.FF_JSON_PREVIEW) && (
              <div className="w-full h-full flex flex-col min-h-[400px]">
                {projectConfigured ? (
                  <SimpleCard
                    title={t("expected_input_preview")}
                    className="w-full h-full overflow-hidden flex flex-col"
                    contentClassName="h-[calc(100%-48px)]"
                    flushContent
                  >
                    {sampleConfig.data ? (
                      <div className={importClass.elem("code-wrapper")}>
                        <CodeBlock
                          title={t("expected_input_preview")}
                          code={sampleConfig?.data ?? ""}
                          className="w-full h-full"
                        />
                      </div>
                    ) : sampleConfig.isLoading ? (
                      <div className="w-full flex justify-center py-12">
                        <Spinner className="h-6 w-6" />
                      </div>
                    ) : sampleConfig.isError ? (
                      <div className="w-[calc(100%-24px)] text-lg text-negative-content bg-negative-background border m-3 rounded-md border-negative-border-subtle p-4">
                        {t("something_went_wrong_loading_sample_data")}
                      </div>
                    ) : null}
                  </SimpleCard>
                ) : (
                  <SimpleCard className="w-full h-full flex flex-col items-center justify-center text-center p-wide">
                    <div className="flex flex-col items-center gap-tight">
                      <div className="bg-primary-background rounded-largest p-tight flex items-center justify-center">
                        <IconCode className="w-6 h-6 text-primary-icon" />
                      </div>
                      <div className="flex flex-col items-center gap-tighter">
                        <div className="text-label-small text-neutral-content font-medium">{t("view_json_input_format")}</div>
                        <div
                          className="text-body-small text-neutral-content-subtler text-center"
                          dangerouslySetInnerHTML={{
                            __html: t("setup_labeling_config_for_json_preview", {
                              labeling_configuration_link: `
                                <button
                                  type=\"button\"
                                  class=\"border-none bg-none p-0 m-0 text-primary-content underline\"
                                  onClick={openConfig}
                                >
                                  ${t("labeling_configuration")}
                                </button>
                              `,
                            }),
                          }}
                        />
                      </div>
                    </div>
                  </SimpleCard>
                )}
              </div>
            )}
          </div>
        </Upload>
      </main>
    </div>
  );
};
