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
package pub.doric;

import android.app.Application;

import com.google.gson.JsonObject;

import pub.doric.dev.DevKit;
import pub.doric.dev.IDevKit;

/**
 * @Description: Doric
 * @Author: pengfei.zhou
 * @CreateDate: 2019-07-18
 */
public class Doric {
    private static Application sApplication;

    public static void init(Application application) {
        sApplication = application;
    }

    public static Application application() {
        return sApplication;
    }

    public static void connectDevKit(String url) {
        DevKit.getInstance().connectDevKit(url);
    }

    public static void sendDevCommand(IDevKit.Command command, JsonObject jsonObject) {
        DevKit.getInstance().sendDevCommand(command, jsonObject);
    }

    public static void disconnectDevKit() {
        DevKit.getInstance().disconnectDevKit();
    }

}
