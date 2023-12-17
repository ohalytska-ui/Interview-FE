import React, { FC } from 'react';
import { Box, Skeleton } from '@mui/material';
import { BarChart, axisClasses } from '@mui/x-charts';
import { StatisticsBarChartProps } from './types';

export const StatisticsBarChart: FC<StatisticsBarChartProps> = ({
  xAxis,
  series,
  loading,
}: StatisticsBarChartProps) => {
  return (
    <>
      {xAxis && series && xAxis.length && series.length && !loading ? (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <BarChart
              xAxis={[{ scaleType: 'band', data: xAxis, label: 'Quarters range' }]}
              series={[{ data: series, type: 'bar' }]}
              width={1000}
              height={500}
              yAxis={[{ label: 'Values' }]}
              sx={{
                [`.${axisClasses.left} .${axisClasses.label}`]: {
                  transform: 'translate(-50px, 0)',
                },
              }}
            />
          </Box>
        </>
      ) : null}
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '20px',
          }}
        >
          <Skeleton variant="rectangular" width={1200} height={40} />
        </Box>
      ) : null}
    </>
  );
};
