import * as Popover from "@radix-ui/react-popover";
import {
  ColorArea,
  parseColor,
  Color,
  ColorSlider,
} from "@react-spectrum/color";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Provider, defaultTheme } from "@adobe/react-spectrum";
import { imageArgs } from "./page";

function setCSSVariableToColor(name: string, value: Color) {
  let root = document.querySelector(":root") as HTMLElement;
  root?.style.setProperty(name, value.toString("hsl"));
}

export const ThemePopover = (props: {
  pageBGImage: imageArgs;
  setPageBGImage: (imageArgs: Partial<imageArgs>) => void;
}) => {
  let [pageValue, setPageValue] = useState(parseColor("hsl(198, 100%, 96%)"));
  let [cardValue, setCardValue] = useState(parseColor("hsl(0, 100%, 100%)"));
  let [textValue, setTextValue] = useState(parseColor("hsl(0, 100%, 15%)"));
  let [accentValue, setAccentValue] = useState(
    parseColor("hsl(240, 100%, 50%)"),
  );
  let [accentTextValue, setAccentTextValue] = useState(
    parseColor("hsl(1, 100%, 100%)"),
  );

  useEffect(() => {
    setCSSVariableToColor("--bg-page", pageValue);
    setCSSVariableToColor("--bg-card", cardValue);
    setCSSVariableToColor("--primary", textValue);
    setCSSVariableToColor("--accent", accentValue);
    setCSSVariableToColor("--accent-text", accentTextValue);
  }, [pageValue, cardValue, textValue, accentValue, accentTextValue]);

  return (
    <Popover.Root>
      <Popover.Trigger>
        {" "}
        <div className="rounded-full w-6 h-6 border" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="w-64 py-2 px-3 bg-bg-page rounded-md border border-border flex flex-col gap-1"
          align="center"
          sideOffset={4}
          collisionPadding={16}
        >
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <strong>page bg</strong>
              <p> {pageValue.toString("hex")} </p>
            </div>
            <ColorPicker value={pageValue} setValue={setPageValue} />
          </div>
          <div className="flex flex-col gap-1">
            <strong>bg image</strong>
            <input
              type="text"
              id="url"
              name="url"
              value={props.pageBGImage.url}
              onChange={(e) => {
                props.setPageBGImage({
                  url: e.currentTarget.value,
                });
              }}
            />
            <input
              type="number"
              id="size"
              name="size"
              value={props.pageBGImage.size}
              min="100"
              onChange={(e) => {
                props.setPageBGImage({
                  size: e.currentTarget.valueAsNumber,
                });
              }}
            />

            <div className="flex gap-2">
              <label htmlFor="repeat">
                <input
                  type="radio"
                  id="repeat"
                  name="repeat"
                  value="repeat"
                  checked={props.pageBGImage.repeat === true}
                  onChange={() => {
                    props.setPageBGImage({
                      repeat: true,
                    });
                  }}
                />
                repeat
              </label>
              <label htmlFor="cover">
                <input
                  type="radio"
                  id="no-repeat"
                  name="repeat"
                  value="no-repeat"
                  checked={props.pageBGImage.repeat === false}
                  onChange={() => {
                    props.setPageBGImage({
                      repeat: false,
                    });
                  }}
                />
                cover
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <strong>card bg</strong>
              <p> {cardValue.toString("hex")} </p>
            </div>
            <ColorPicker value={cardValue} setValue={setCardValue} />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <strong>text color</strong>
              <p> {textValue.toString("hex")} </p>
            </div>
            <ColorPicker value={textValue} setValue={setTextValue} />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <strong>accent color</strong>
              <p> {accentValue.toString("hex")} </p>
            </div>
            <ColorPicker value={accentValue} setValue={setAccentValue} />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <strong>text on accent</strong>
              <p> {accentTextValue.toString("hex")} </p>
            </div>
            <ColorPicker
              value={accentTextValue}
              setValue={setAccentTextValue}
            />
          </div>

          <Popover.Arrow />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

const ColorPicker = (props: {
  value: Color;
  setValue: Dispatch<SetStateAction<Color>>;
}) => {
  return (
    <Provider theme={defaultTheme}>
      <ColorArea
        defaultValue={props.value}
        xChannel="saturation"
        yChannel="lightness"
        value={props.value}
        onChange={props.setValue}
        size={"400px"}
        maxWidth={"100%"}
        maxHeight={"100px"}
      />
      <ColorSlider
        channel="hue"
        value={props.value}
        onChange={props.setValue}
        label={null}
      />
    </Provider>
  );
};
