import React, { ReactNode, useMemo, useState } from 'react';
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
import { InfoTooltip, useTimeZone } from '@perses-dev/components';
import AlertIcon from 'mdi-material-ui/Alert';

const formatDate = (timeMs: number, format: (date: Date, format: string) => string): { date: string; time: string } => {
  const d = new Date(timeMs);
  return {
    date: format(d, 'MMM dd, yyyy'),
    time: format(d, 'HH:mm:ss'),
  };
};

interface AnnotationPreviewCardProps extends CardProps {
  value: AnnotationData;
  formatWithUserTimeZone: (date: Date, format: string) => string;
}

function AnnotationPreviewCard({ value, formatWithUserTimeZone, ...props }: AnnotationPreviewCardProps): ReactNode {
  const start = formatDate(value.start, formatWithUserTimeZone);
  const end = value.end !== undefined ? formatDate(value.start, formatWithUserTimeZone) : null;

  const tags = useMemo(() => {
    return Object.entries(value.tags ?? []).map(([key, value]) => {
      return { key: key, value: value };
    });
  }, [value.tags]);

  return (
    <Card {...props}>
      <CardContent>
        <Stack gap={2}>
          {value.title && <Typography variant="h3">{value.title}</Typography>}
          {value.legend && <Typography>{value.legend}</Typography>}

          <Stack flexWrap="wrap" direction="row" gap={0.5}>
            {tags.map((tag) => (
              <Chip size="small" key={`${tag.key}=${tag.value}`} label={`${tag.key}: ${tag.value}`} />
            ))}
          </Stack>
        </Stack>

        <Divider sx={{ marginY: 2 }} />

        <Stack gap={0.5} direction="row">
          <Typography variant="caption">
            {start.date} - <strong>{start.time}</strong>
          </Typography>
          {end && (
            <>
              <Typography variant="caption">{' → '}</Typography>
              <Typography variant="caption">
                {end.date} - <strong>{end.time}</strong>
              </Typography>
            </>
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
  const { formatWithUserTimeZone } = useTimeZone();

  const [showAll, setShowAll] = useState<boolean>(false);
  const annotationsToShow = showAll ? data : data?.slice(0, 1);
  let notShown = 0;
  if (data && data?.length > 0 && annotationsToShow) {
    notShown = data.length - annotationsToShow.length;
  }

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
        {annotationsToShow?.map((item, index) => (
          <AnnotationPreviewCard
            key={index}
            value={item}
            formatWithUserTimeZone={formatWithUserTimeZone}
            sx={{ width: '100%' }}
          />
        ))}
        {notShown > 0 && (
          <Chip onClick={() => setShowAll(true)} variant="outlined" size="small" label={`+${notShown} more`} />
        )}
        {showAll && data && data.length > 1 && (
          <Chip onClick={() => setShowAll(false)} variant="outlined" size="small" label="-" />
        )}
      </CardContent>
    </Card>
  );
}
