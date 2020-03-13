/*
 * Copyright [2019] [Doric.Pub]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { IView, View, Property } from "../ui/view"
import { layoutConfig } from "../util/layoutconfig"
import { Color } from "../util/color"

export enum ScaleType {
    ScaleToFill = 0,
    ScaleAspectFit,
    ScaleAspectFill,
}

export interface IImage extends IView {
    imageUrl?: string
    /** 
     * Read image from local path
     * For android,it based on assets dir.
     * For iOS,it based on main bundle dir.
    */
    imagePath?: string

    /** 
     * Read image from resource 
     * For android,it will try to read from drawable.
     * For iOS,it will try to read from Image.Assets.
     */
    imageRes?: string

    imageBase64?: string
    scaleType?: ScaleType
    isBlur?: boolean
    /**
     * Display while image is loading 
     * Local file name
     */
    placeHolderImage?: string

    /**
     * Display while image is loading 
     * Color
     * This priority is lower than placeHolderImage
     */
    placeHolderColor?: Color

    /**
     * Display while image is failed to load 
     * It can be file name in local path
     */
    errorImage?: string

    /**
     * Display while image is failed to load  
     * Color
     * This priority is lower than errorImage
     */
    errorColor?: Color
    loadCallback?: (image: { width: number; height: number } | undefined) => void
}

export class Image extends View implements IImage {
    @Property
    imageUrl?: string

    @Property
    imagePath?: string

    @Property
    imageRes?: string

    @Property
    imageBase64?: string

    @Property
    scaleType?: ScaleType

    @Property
    isBlur?: boolean

    @Property
    placeHolderImage?: string

    @Property
    placeHolderColor?: Color

    @Property
    errorImage?: string

    @Property
    errorColor?: Color

    @Property
    loadCallback?: (image: { width: number; height: number } | undefined) => void
}

export function image(config: IImage) {
    const ret = new Image
    ret.layoutConfig = layoutConfig().fit()
    for (let key in config) {
        Reflect.set(ret, key, Reflect.get(config, key, config), ret)
    }
    return ret
}