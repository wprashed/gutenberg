/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalHStack as HStack,
	// TODO: Replace this ZStack with ad hoc CSS.
	// eslint-disable-next-line @wordpress/use-recommended-components
	__experimentalZStack as ZStack,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	ColorIndicator,
	Flex,
	FlexItem,
	Dropdown,
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { reset as resetIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ColorGradientControl from '../colors-gradients/control';
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

const popoverProps = {
	placement: 'left-start',
	offset: 36,
	shift: true,
};

const LabeledColorIndicators = ( { indicators, label } ) => (
	<HStack justify="flex-start">
		<ZStack isLayered={ false } offset={ -8 }>
			{ indicators.map( ( indicator, index ) => (
				<Flex key={ index } expanded={ false }>
					<ColorIndicator colorValue={ indicator } />
				</Flex>
			) ) }
		</ZStack>
		<FlexItem className="block-editor-panel-color-gradient-settings__color-name">
			{ label }
		</FlexItem>
	</HStack>
);

function ColorGradientTab( {
	isGradient,
	inheritedValue,
	userValue,
	setValue,
	colorGradientControlSettings,
} ) {
	return (
		<ColorGradientControl
			{ ...colorGradientControlSettings }
			showTitle={ false }
			enableAlpha
			__experimentalIsRenderedInSidebar
			colorValue={ isGradient ? undefined : inheritedValue }
			gradientValue={ isGradient ? inheritedValue : undefined }
			onColorChange={ isGradient ? undefined : setValue }
			onGradientChange={ isGradient ? setValue : undefined }
			clearable={ inheritedValue === userValue }
			headingLevel={ 3 }
		/>
	);
}

// Renders a ToolsPanelItem that opens a dropdown containing one or more
// color/gradient pickers. Shared between the Color, Background, and
// Typography panels for consistent color-style controls.
export default function ColorGradientDropdownItem( {
	label,
	hasValue,
	resetValue,
	isShownByDefault,
	indicators,
	tabs,
	colorGradientControlSettings,
	panelId,
	className = 'block-editor-tools-panel-color-gradient-settings__item',
} ) {
	const currentTab = tabs.find( ( tab ) => tab.userValue !== undefined );
	const { key: firstTabKey, ...firstTab } = tabs[ 0 ] ?? {};
	const colorGradientDropdownButtonRef = useRef( undefined );
	return (
		<ToolsPanelItem
			className={ className }
			hasValue={ hasValue }
			label={ label }
			onDeselect={ resetValue }
			isShownByDefault={ isShownByDefault }
			panelId={ panelId }
		>
			<Dropdown
				popoverProps={ popoverProps }
				className="block-editor-tools-panel-color-gradient-settings__dropdown"
				renderToggle={ ( { onToggle, isOpen } ) => {
					const toggleProps = {
						onClick: onToggle,
						className: clsx(
							'block-editor-panel-color-gradient-settings__dropdown',
							{ 'is-open': isOpen }
						),
						'aria-expanded': isOpen,
						ref: colorGradientDropdownButtonRef,
					};

					return (
						<>
							<Button { ...toggleProps } __next40pxDefaultSize>
								<LabeledColorIndicators
									indicators={ indicators }
									label={ label }
								/>
							</Button>
							{ hasValue() && (
								<Button
									__next40pxDefaultSize
									label={ __( 'Reset' ) }
									className="block-editor-panel-color-gradient-settings__reset"
									size="small"
									icon={ resetIcon }
									onClick={ () => {
										resetValue();
										if ( isOpen ) {
											onToggle();
										}
										// Return focus to parent button
										colorGradientDropdownButtonRef.current?.focus();
									} }
								/>
							) }
						</>
					);
				} }
				renderContent={ () => (
					<DropdownContentWrapper paddingSize="none">
						<div className="block-editor-panel-color-gradient-settings__dropdown-content">
							{ tabs.length === 1 && (
								<ColorGradientTab
									key={ firstTabKey }
									{ ...firstTab }
									colorGradientControlSettings={
										colorGradientControlSettings
									}
								/>
							) }
							{ tabs.length > 1 && (
								<Tabs defaultTabId={ currentTab?.key }>
									<Tabs.TabList>
										{ tabs.map( ( tab ) => (
											<Tabs.Tab
												key={ tab.key }
												tabId={ tab.key }
											>
												{ tab.label }
											</Tabs.Tab>
										) ) }
									</Tabs.TabList>

									{ tabs.map( ( tab ) => {
										const { key: tabKey, ...restTabProps } =
											tab;
										return (
											<Tabs.TabPanel
												key={ tabKey }
												tabId={ tabKey }
												focusable={ false }
											>
												<ColorGradientTab
													key={ tabKey }
													{ ...restTabProps }
													colorGradientControlSettings={
														colorGradientControlSettings
													}
												/>
											</Tabs.TabPanel>
										);
									} ) }
								</Tabs>
							) }
						</div>
					</DropdownContentWrapper>
				) }
			/>
		</ToolsPanelItem>
	);
}
