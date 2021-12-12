import {
  CloudDownloadOutlined,
  CloudSyncOutlined,
  DeleteOutlined,
  LoadingOutlined,
  RocketOutlined,
  RocketTwoTone,
  UsbOutlined,
} from "@ant-design/icons";
import { Alert, Button, Progress, Result, Steps, Typography } from "antd";
import React from "react";
import { Link } from "react-router-dom";

type FlashingStageStatus = {
  progress: number;
  started: boolean;
  completed: boolean;
  error?: string | null;
};

type FlashingState = {
  connect: FlashingStageStatus;
  build?: FlashingStageStatus | null;
  download?: FlashingStageStatus | null;
  erase: FlashingStageStatus;
  flash: FlashingStageStatus;
};

type Props = {
  state: FlashingState;
};

type StageConfig = {
  titles: {
    pre: string;
    active: string;
    post: string;
  };
  stage: keyof FlashingState;
  description: {
    pre: string;
    active: string;
    post: string;
    error: string;
  };
  showProgess?: boolean;
  Icon: React.FC;
};

const stageConfigs: StageConfig[] = [
  {
    titles: {
      pre: "Connect",
      active: "Connecting",
      post: "Connected",
    },
    stage: "connect",
    description: {
      pre: "Connect to DFU interface",
      active: "Connecting to DFU interface and verifying configuration",
      post: "DFU connection active",
      error: "Could not connect to DFU interface",
    },
    Icon: UsbOutlined,
  },
  {
    titles: { pre: "Build", active: "Building", post: "Built" },
    stage: "build",
    description: {
      pre: "Start firmware build",
      active: "Building firmware with specified configurations",
      post: "Firmware build completed",
      error: "Could not build firmware",
    },
    Icon: CloudSyncOutlined,
  },
  {
    titles: { pre: "Download", active: "Downloading", post: "Downloaded" },
    stage: "download",
    description: {
      pre: "Download firmeware data",
      active: "Downloading firmware data to be ready for flashing",
      post: "Firmware downloaded, ready to flash",
      error: "Could not download firmware",
    },
    Icon: CloudDownloadOutlined,
  },
  {
    titles: { pre: "Erase", active: "Erasing", post: "Erased" },
    stage: "erase",
    description: {
      pre: "Remove existing firmware",
      active: "Removing existing firmware from device",
      post: "Existing firmware erased",
      error: "Could not erase existing firmeware",
    },
    Icon: DeleteOutlined,
    showProgess: true,
  },
  {
    titles: { pre: "Flash", active: "Flashing", post: "Flashed" },
    stage: "flash",
    description: {
      pre: "Write new firmware",
      active: "Writing new firmware to device, this could take several minutes",
      post: "New firmware flashed",
      error: "Could not write new firmware to device",
    },
    Icon: CloudDownloadOutlined,
    showProgess: true,
  },
];

const stageTitle = (
  config: StageConfig,
  stage: FlashingStageStatus
): string => {
  if (!stage.started) {
    return config.titles.pre;
  }

  if (!stage.completed) {
    return config.titles.active;
  }

  return config.titles.post;
};

const stageIcon = (
  config: StageConfig,
  stage: FlashingStageStatus
): React.ReactNode => {
  if (stage.error) {
    return undefined;
  }
  if (stage.completed) {
    return undefined;
  }

  if (stage.started) {
    return <LoadingOutlined />;
  }

  return <config.Icon />;
};

const status = (
  stage: FlashingStageStatus
): "wait" | "process" | "error" | "finish" => {
  if (stage.completed) {
    return "finish";
  }

  if (stage.error) {
    return "error";
  }

  if (stage.started) {
    return "process";
  }

  return "wait";
};

const stageDescription = (
  config: StageConfig,
  stage: FlashingStageStatus
): string => {
  const currentStatus = status(stage);
  switch (currentStatus) {
    case "error":
      return config.description.error;
    case "finish":
      return config.description.post;
    case "wait":
      return config.description.pre;
    case "process":
      return config.description.active;
  }

  return "";
};

const stepBaseStyle = {
  flex: 1,
  overflow: "hidden",
  transition: "max-height 0.25s ease-out",
};

const FlashProgress: React.FC<Props> = ({ state }) => {
  const lastStepCompleted =
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    state[stageConfigs[stageConfigs.length - 1]!.stage]!.completed;
  const minStepHeight = !lastStepCompleted ? 80 : 60;

  return (
    <Steps
      direction="vertical"
      current={stageConfigs.findIndex(
        (stage) => state[stage.stage] && !state[stage.stage]?.started
      )}
      style={{ height: "100%", maxHeight: "600px" }}
    >
      {
        // Annoying that we can't make this it's own component. Something to do with
        // Internals of how ant makes these steps
        stageConfigs.map((config) => {
          const stageStatus = state[config.stage];
          const active = stageStatus?.started && !stageStatus.completed;
          return stageStatus ? (
            <Steps.Step
              style={{
                ...stepBaseStyle,
                paddingBottom: 16,
                maxHeight: active ? 300 : minStepHeight,
              }}
              key={config.stage}
              icon={stageIcon(config, stageStatus)}
              title={stageTitle(config, stageStatus)}
              status={status(stageStatus)}
              description={
                !lastStepCompleted ? (
                  <>
                    <Typography.Text
                      type={
                        stageStatus.error
                          ? "danger"
                          : ((!stageStatus.started || stageStatus.completed) &&
                              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                              "secondary") ||
                            undefined
                      }
                    >
                      {stageDescription(config, stageStatus)}
                    </Typography.Text>
                    {config.showProgess && (
                      <div
                        style={{
                          marginRight: 32,
                          marginTop: 32,
                        }}
                      >
                        <Progress
                          // Round to 2dp
                          percent={Math.round(stageStatus.progress * 100) / 100}
                          status={stageStatus.error ? "exception" : "active"}
                        />
                      </div>
                    )}
                    {stageStatus.error && (
                      <Alert
                        style={{ marginTop: 16 }}
                        message="Error"
                        description={stageStatus.error}
                        type="error"
                        action={
                          <Button disabled size="small" danger>
                            Detail
                          </Button>
                        }
                      />
                    )}
                  </>
                ) : null
              }
            />
          ) : null;
        })
      }
      <Steps.Step
        status={lastStepCompleted ? "finish" : "wait"}
        title={lastStepCompleted ? "Completed" : "Completed"}
        icon={lastStepCompleted ? undefined : <RocketOutlined />}
        style={{
          ...stepBaseStyle,
          maxHeight: lastStepCompleted ? 300 : 40,
        }}
        description={
          <Result
            style={{ padding: 8, textAlign: "center" }}
            icon={<RocketTwoTone style={{ fontSize: 48 }} />}
            title="Your device has been upgraded"
          >
            <Typography.Text>
              You may now want to <Link to="/sdcard">setup your SD Card</Link>
            </Typography.Text>
          </Result>
        }
      />
    </Steps>
  );
};

export default FlashProgress;