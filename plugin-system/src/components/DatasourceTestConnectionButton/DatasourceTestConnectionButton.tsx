import { ReactElement, useCallback } from 'react';
import { Button, ButtonProps } from '@mui/material';
import { useUnsavedDatasourceStore } from '@perses-dev/plugin-system';
import { useSnackbar } from '@perses-dev/components';
import { DatasourceSpec } from '@perses-dev/core';

type DatasourceTestConnectionButtonProps = (
  | {
      connectionType: 'proxy';
      spec: DatasourceSpec;
      directUrl?: undefined;
      healthCheckPath: string;
    }
  | {
      connectionType: 'direct';
      spec?: undefined;
      directUrl: string;
      healthCheckPath: string;
    }
) &
  Omit<ButtonProps, 'onClick'>;
export const DatasourceTestConnectionButton = ({
  healthCheckPath,
  connectionType,
  spec,
  directUrl,
  ...buttonProps
}: DatasourceTestConnectionButtonProps): ReactElement => {
  const datasourceStore = useUnsavedDatasourceStore();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();

  const testConnection = useCallback(
    async function isHealthy(): Promise<boolean> {
      switch (connectionType) {
        case 'direct':
          return datasourceStore.testDirectConnection(directUrl, healthCheckPath);
        case 'proxy':
          return datasourceStore.testProxyConnection(spec, healthCheckPath);
      }
    },
    [connectionType, datasourceStore, directUrl, healthCheckPath, spec]
  );

  const handleTestConnection = useCallback(
    async function handleTestConnection(): Promise<void> {
      const isHealthy = await testConnection();
      if (isHealthy) {
        successSnackbar('Datasource is healthy');
      } else {
        exceptionSnackbar(new Error('Datasource is not healthy'));
      }
    },
    [exceptionSnackbar, testConnection, successSnackbar]
  );
  return (
    <Button onClick={handleTestConnection} color="info" variant="outlined" {...buttonProps}>
      Test Connection
    </Button>
  );
};
