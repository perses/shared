import React, { ReactNode, useMemo } from 'react';
import { AnnotationData, AnnotationSpec } from '@perses-dev/spec';
import {
  Card,
  CardContent,
  CardHeader,
  CardProps,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { useAnnotationData } from '@perses-dev/plugin-system';
import { formatWithTimeZone, InfoTooltip } from '@perses-dev/components';
import AlertIcon from 'mdi-material-ui/Alert';

export const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

interface AnnotationPreviewCardProps {
  value: AnnotationData;
}

function AnnotationPreviewCard(props: AnnotationPreviewCardProps): ReactNode {
  const tags = useMemo(() => {
    return Object.entries(props.value.tags ?? []).map(([key, value]) => {
      return { key: key, value: value };
    });
  }, [props.value.tags]);

  return (
    <Card>
      <CardContent>
        <Stack gap={1}>
          <Typography variant="h3">{props.value.title}</Typography>
          <Typography>{props.value.legend}</Typography>

          <Stack flexWrap="wrap" direction="row" gap={0.5} paddingTop={2}>
            {tags.map((tag) => (
              <Chip size="small" key={`${tag.key}=${tag.value}`} label={`${tag.key}: ${tag.value}`} />
            ))}
          </Stack>
        </Stack>

        <Divider sx={{ marginY: 2 }} />

        <Stack justifyContent="space-between" gap={0.5}>
          <Stack direction="row">
            <Typography>{formatWithTimeZone(new Date(props.value.start * 1000), DATE_TIME_FORMAT)}</Typography>
          </Stack>
          {props.value.end !== undefined && (
            <Stack direction="row">
              <Typography>{formatWithTimeZone(new Date(props.value.end * 1000), DATE_TIME_FORMAT)}</Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export interface AnnotationPreviewProps extends CardProps {
  spec: AnnotationSpec;
}

export function AnnotationPreview({ spec, ...props }: AnnotationPreviewProps): ReactNode {
  const { data, isFetching, error } = useAnnotationData(spec);

  const stateIndicator = useMemo((): ReactNode | undefined => {
    if (isFetching) {
      return <CircularProgress aria-label="loading" size="1.125rem" />;
    } else if (error) {
      return (
        <InfoTooltip description={error.toString()}>
          <IconButton aria-label="preview errors" size="small">
            <AlertIcon
              fontSize="inherit"
              sx={{
                color: (theme) => theme.palette.error.main,
              }}
            />
          </IconButton>
        </InfoTooltip>
      );
    }
  }, [isFetching, error]);

  return (
    <Card variant="outlined" {...props}>
      <CardHeader
        title={
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="h4">Preview Annotations</Typography>
            {stateIndicator}
          </Stack>
        }
      />
      <CardContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, paddingY: 0 }}>
        {data?.map((item, index) => (
          <AnnotationPreviewCard key={index} value={item} />
        ))}
      </CardContent>
    </Card>
  );
}
