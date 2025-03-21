import { useMutation } from '@tanstack/react-query';
import { core } from '@tauri-apps/api';

import { wadHashtableQueryKeys } from '..';
import { queryClient } from '../../../lib/query';
import { wadHashtableCommands } from '../commands';

export type UseLoadWadHashtablesContext = {
  actionId: string;
};

export const loadWadHashtables = ({ actionId }: UseLoadWadHashtablesContext) =>
  core.invoke(wadHashtableCommands.loadWadHashtables, { actionId });

export const useLoadWadHashtables = () => {
  return useMutation({
    mutationFn: loadWadHashtables,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wadHashtableQueryKeys.wadHashtableStatus });
    },
  });
};
