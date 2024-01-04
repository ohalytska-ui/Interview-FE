import React, { useEffect, useState, FC } from 'react';
import {
  Container,
  Card,
  CardContent,
  TextField,
  CardActions,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  debounce,
  FormHelperText,
} from '@mui/material';
import { useForm, SubmitHandler } from 'react-hook-form';
import { FormInput, FormInputs, StatisticsFormDataType, PrevFormDataType, Dataset } from './types';
import { getStatisticsQueryData, options } from './mocks';
import { useSearchParams } from 'react-router-dom';
import { generateQuarterRange } from './helpers';
import { LoadingButton } from '@mui/lab';
import { StatisticsBarChart } from 'components/statistics-bar-chart';
import { Snackbar } from 'components/snackbar';
import { rangeRegexPattern } from './regex';
import { MAX_FORM_DATA_SIZE } from './constants';

const URL = 'https://data.ssb.no/api/v0/no/table/07241';

export const Home: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [xAxis, setXAxis] = useState<string[]>([]);
  const [series, setSeries] = useState<number[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [prevStatisticsFormData, setPrevStatisticsFormData] = useState<PrevFormDataType[]>([]);
  const [prevFormData, setPrevFormData] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<FormInput>({
    mode: 'onSubmit',
    defaultValues: {
      houseType: searchParams.get('houseType') ?? '',
      quarterEnd: searchParams.get('quarterEnd') ?? undefined,
      quarterStart: searchParams.get('quarterStart') ?? undefined,
    },
  });

  const { houseType } = watch();

  const saveFormDataToLocalStorage = (formData: FormInput) => {
    const timestamp = new Date().getTime();
    const storedFormData: StatisticsFormDataType[] = JSON.parse(localStorage.getItem('statisticsFormData') || '[]');

    if (storedFormData.length < MAX_FORM_DATA_SIZE) {
      storedFormData.push({ timestamp, data: formData });
    } else {
      const oldestEntry = storedFormData.reduce((oldest, current) =>
        current.timestamp < oldest.timestamp ? current : oldest,
      );
      const index = storedFormData.indexOf(oldestEntry);
      storedFormData[index] = { timestamp, data: formData };
    }

    localStorage.setItem('statisticsFormData', JSON.stringify(storedFormData));
    setPrevFormData('');
  };

  const updateFormAndURL = debounce((type: FormInputs, value: string) => {
    setValue(`${type}`, value);
    searchParams.set(type, value);
    setSearchParams(searchParams.toString());
    sessionStorage.setItem(type, JSON.stringify(value));
  });

  const getPrevFormData = (value: string) => {
    const selectedFormData = prevStatisticsFormData.find(({ label }) => label === value);
    setPrevFormData(selectedFormData?.label ?? '');
    if (selectedFormData?.value) {
      const { houseType, quarterEnd, quarterStart } = selectedFormData.value;
      setValue(FormInputs.HouseType, houseType);
      setValue(FormInputs.QuarterStart, quarterStart);
      setValue(FormInputs.QuarterEnd, quarterEnd);
      setXAxis([]);
      setSeries([]);
    }
  };

  const handleClose = (_: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
    setMessage('Statistics fetched successfully!');
  };

  const onSubmit: SubmitHandler<FormInput> = async (formData: FormInput) => {
    setLoading(true);
    const { houseType, quarterStart, quarterEnd } = formData;
    if (houseType && quarterStart && quarterEnd) {
      const response = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: getStatisticsQueryData(houseType, generateQuarterRange(quarterStart, quarterEnd)),
      });
      if (!response.ok) {
        const data = await response.json();
        setOpen(true);
        setMessage(`Error of getting statistics: ${data.error}`);
      } else {
        const data: Dataset = await response.json();
        const quarters = data?.dimension?.Tid?.category?.label;
        const quartersArray = Object.entries(quarters).map((quarter) => quarter?.[1]);
        setSeries(data?.value);
        setXAxis(quartersArray);
        saveFormDataToLocalStorage(formData);
        sessionStorage.setItem(FormInputs.HouseType, JSON.stringify(formData.houseType));
        sessionStorage.setItem(FormInputs.QuarterStart, JSON.stringify(formData.quarterStart));
        sessionStorage.setItem(FormInputs.QuarterEnd, JSON.stringify(formData.quarterEnd));
        handleOpen();
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!searchParams.toString().length) {
      const houseType = sessionStorage.getItem(FormInputs.HouseType);
      const quarterStart = sessionStorage.getItem(FormInputs.QuarterStart);
      const quarterEnd = sessionStorage.getItem(FormInputs.QuarterEnd);
      setValue('houseType', houseType ? JSON.parse(houseType) : '');
      setValue('quarterStart', quarterStart ? JSON.parse(quarterStart) : undefined);
      setValue('quarterEnd', quarterEnd ? JSON.parse(quarterEnd) : undefined);
    }
  }, [setValue, searchParams]);

  // Small improvement: I added a little bit of imagination and stored not just the previous value of formData but 5 previous ones, so the user can restore more values
  useEffect(() => {
    const storedFormData: StatisticsFormDataType[] = JSON.parse(localStorage.getItem('statisticsFormData') || '[]');
    const transformedOptions = storedFormData.map(({ timestamp, data }) => ({
      label: new Date(timestamp).toLocaleString(),
      value: data,
    }));
    setPrevStatisticsFormData(transformedOptions);
  }, [loading]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: '20px',
      }}
    >
      <Container maxWidth="lg">
        <Card style={{ height: 'auto', width: 'auto' }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '20px',
              }}
            >
              <FormControl fullWidth>
                <InputLabel id="house-type-select-label">House Type:</InputLabel>
                <Select
                  labelId="house-type-select-label"
                  id="quarters-select"
                  label="House Type:"
                  required
                  {...register('houseType', { required: true })}
                  value={houseType}
                  onChange={(e) => updateFormAndURL(FormInputs.HouseType, e.target.value)}
                >
                  {options.map((option) => (
                    <MenuItem key={option.label} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl
                fullWidth
                style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: '10px' }}
              >
                <TextField
                  fullWidth
                  {...register('quarterStart', { required: true, pattern: rangeRegexPattern })}
                  required
                  onChange={(e) => updateFormAndURL(FormInputs.QuarterStart, e.target.value)}
                  error={!!errors.quarterStart}
                  helperText={errors.quarterStart ? 'Invalid quarter range!' : null}
                  label="Quarter Start"
                />
                <TextField
                  fullWidth
                  {...register('quarterEnd', { required: true, pattern: rangeRegexPattern })}
                  required
                  onChange={(e) => updateFormAndURL(FormInputs.QuarterEnd, e.target.value)}
                  error={!!errors.quarterEnd}
                  helperText={errors.quarterEnd ? 'Invalid quarter range!' : null}
                  label="Quarter End"
                />
              </FormControl>
              {prevStatisticsFormData.length ? (
                <FormControl fullWidth>
                  <InputLabel id="previous-data-label">Previous saved data</InputLabel>
                  <Select
                    onChange={(e) => getPrevFormData(String(e.target.value))}
                    value={prevFormData}
                    label="Previous saved data"
                    labelId="previous-data-label"
                  >
                    {prevStatisticsFormData.map((option) => (
                      <MenuItem key={option.label} value={option.label}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {prevFormData.length ? (
                    <FormHelperText>Your previous saved data {prevFormData}</FormHelperText>
                  ) : null}
                </FormControl>
              ) : null}
            </CardContent>
            <CardActions style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <LoadingButton loading={loading} variant="outlined" type="submit" style={{ marginTop: '20px' }}>
                Get statistics
              </LoadingButton>
            </CardActions>
          </form>
        </Card>
        <StatisticsBarChart series={series} xAxis={xAxis} loading={loading} />
      </Container>
      <div>
        <Snackbar handleClose={handleClose} open={open} message={message} />
      </div>
    </Box>
  );
};

export default Home;
