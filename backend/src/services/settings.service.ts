import { getSystemSettingsDal, createDefaultSettingsDal, upsertSystemSettingsDal } from '../dal/settings.dal';

export const getSystemSettingsService = async () => {
  let settings = await getSystemSettingsDal();
  if (!settings) {
    settings = await createDefaultSettingsDal(45);
  }
  return settings;
};

export const updateSystemSettingsService = async (days: number) => {
  return upsertSystemSettingsDal(days);
};
