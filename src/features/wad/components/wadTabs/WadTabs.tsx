import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  DraggableProvidedDragHandleProps,
  DraggableStateSnapshot,
  Droppable,
  OnDragEndResponder,
} from '@hello-pangea/dnd';
import * as RadixTabs from '@radix-ui/react-tabs';
import clsx from 'clsx';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RxDragHandleDots2 } from 'react-icons/rx';

import { CloseIcon } from '../../../../assets';
import { Icon, Tooltip } from '../../../../components';
import { useReorderMountedWad, useUnmountWad } from '../../api';
import { MountedWad } from '../../types';
import { MountWadsButton } from './MountWadsButton';
import { WadDirectoryTabContent, WadRootTabContent } from './WadTabContent';
import { WadTabContextMenu } from './WadTabContextMenu';

export type WadTabsProps = {
  wads: MountedWad[];

  selectedWad?: string;
  selectedItemId?: string;
  onSelectedWadChanged?: (selectedWad: string) => void;
  onWadClose?: (wadId: string) => void;
};

export const WadTabs: React.FC<WadTabsProps> = ({
  wads,
  selectedWad,
  selectedItemId,
  onSelectedWadChanged,
  onWadClose,
}) => {
  const unmountWadMutation = useUnmountWad();
  const reorderWadMutation = useReorderMountedWad();

  const handleTabClose = (wadId: string) => {
    unmountWadMutation.mutate(
      { wadId },
      {
        onSuccess: () => {
          onWadClose?.(wadId);
        },
      },
    );
  };

  const handleDragEnd: OnDragEndResponder = (result, _provided) => {
    if (result.destination) {
      reorderWadMutation.mutate({
        sourceIndex: result.source.index,
        destIndex: result.destination.index,
      });
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <RadixTabs.Root
        className="flex w-full flex-col gap-2"
        orientation="horizontal"
        value={selectedWad}
        onValueChange={onSelectedWadChanged}
      >
        <div className="flex w-full flex-row">
          <Droppable droppableId="wad_tabs" direction="horizontal">
            {(provided, snapshot) => (
              <RadixTabs.List
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={clsx(
                  'flex flex-1',
                  'data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col',
                  'rounded rounded-r-none border border-gray-700 bg-gray-800 transition-colors',
                  'overflow-x-scroll [scrollbar-gutter:stable]',
                  'relative min-h-[2.5rem]',
                  { 'border-obsidian-500 ': snapshot.isDraggingOver },
                )}
              >
                {wads.map((mountedWad, index) => {
                  return (
                    <Draggable key={mountedWad.id} draggableId={mountedWad.id} index={index}>
                      {(provided, snapshot) => (
                        <TabTrigger
                          key={mountedWad.id}
                          mountedWad={mountedWad}
                          provided={provided}
                          snapshot={snapshot}
                          handleTabClose={handleTabClose}
                        />
                      )}
                    </Draggable>
                  );
                })}
              </RadixTabs.List>
            )}
          </Droppable>
          <MountWadsButton />
        </div>
        {wads.map((mountedWad) => {
          return (
            <RadixTabs.Content key={mountedWad.id} className="flex-1" value={mountedWad.id}>
              {selectedItemId ? (
                <WadDirectoryTabContent wadId={mountedWad.id} selectedItemId={selectedItemId} />
              ) : (
                <WadRootTabContent wadId={mountedWad.id} />
              )}
            </RadixTabs.Content>
          );
        })}
      </RadixTabs.Root>
    </DragDropContext>
  );
};

type TabTriggerProps = {
  mountedWad: MountedWad;

  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  handleTabClose: (wadId: string) => void;
};

const TabTrigger: React.FC<TabTriggerProps> = ({
  mountedWad,
  handleTabClose,
  provided,
  snapshot,
}) => {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <div ref={provided.innerRef} {...provided.draggableProps}>
          <WadTabContextMenu wadId={mountedWad.id}>
            <RadixTabs.Trigger
              value={mountedWad.id}
              className={clsx(
                'group flex h-full flex-row items-center justify-center gap-1 rounded-t-sm border-r border-r-gray-600 bg-gray-800 px-[0.5rem] py-[0.25rem] text-sm hover:bg-gray-700',
                'data-[state=active]:border-t-2 data-[state=active]:border-t-obsidian-700 data-[state=active]:bg-gray-700',
                { 'border-t border-t-obsidian-700 ': snapshot.isDragging },
              )}
            >
              <TabTriggerDragHandle dragHandleProps={provided.dragHandleProps} />
              {mountedWad.name}
              <TabTriggerCloseButton onClick={() => handleTabClose(mountedWad.id)} />
            </RadixTabs.Trigger>
          </WadTabContextMenu>
        </div>
      </Tooltip.Trigger>
      <Tooltip.Content side="bottom" className="text-xs">
        {mountedWad.wadPath}
      </Tooltip.Content>
    </Tooltip.Root>
  );
};

type TabTriggerDragHandleProps = {
  dragHandleProps: DraggableProvidedDragHandleProps | null;
};

const TabTriggerDragHandle: React.FC<TabTriggerDragHandleProps> = ({ dragHandleProps }) => {
  const [t] = useTranslation('mountedWads');

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <div
          {...dragHandleProps}
          className="flex items-center justify-center rounded transition-colors"
        >
          <Icon size="md" className="text-gray-400" icon={RxDragHandleDots2} />
        </div>
      </Tooltip.Trigger>
      <Tooltip.Content className="text-sm">{t('tab.dndTooltip')}</Tooltip.Content>
    </Tooltip.Root>
  );
};

type TabTriggerCloseButtonProps = {
  onClick: React.MouseEventHandler<SVGSVGElement>;
};

const TabTriggerCloseButton: React.FC<TabTriggerCloseButtonProps> = ({ onClick }) => {
  const [t] = useTranslation('mountedWads');

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <span className="invisible ml-auto rounded p-1 opacity-0 transition-opacity duration-150 hover:bg-obsidian-500/40 group-hover:visible group-hover:opacity-100">
          <Icon size="sm" icon={CloseIcon} onClick={onClick} />
        </span>
      </Tooltip.Trigger>
      <Tooltip.Content side="top" className="text-sm">
        {t('tab.closeTooltip')}
      </Tooltip.Content>
    </Tooltip.Root>
  );
};
