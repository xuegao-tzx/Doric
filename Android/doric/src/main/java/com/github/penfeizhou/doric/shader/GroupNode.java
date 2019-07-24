package com.github.penfeizhou.doric.shader;

import android.util.SparseArray;
import android.view.ViewGroup;

import com.github.penfeizhou.doric.DoricContext;
import com.github.pengfeizhou.jscore.JSArray;
import com.github.pengfeizhou.jscore.JSObject;
import com.github.pengfeizhou.jscore.JSValue;

import java.util.HashMap;
import java.util.Map;

/**
 * @Description: com.github.penfeizhou.doric.widget
 * @Author: pengfei.zhou
 * @CreateDate: 2019-07-20
 */
public abstract class GroupNode<F extends ViewGroup> extends ViewNode<F> {
    private Map<String, ViewNode> mChildrenNode = new HashMap<>();
    private SparseArray<ViewNode> mIndexInfo = new SparseArray<>();

    public GroupNode(DoricContext doricContext) {
        super(doricContext);
    }

    @Override
    protected void blend(F view, ViewGroup.LayoutParams layoutParams, String name, JSValue prop) {
        super.blend(view, layoutParams, name, prop);
        switch (name) {
            case "children":
                JSArray jsArray = prop.asArray();
                int i;
                for (i = 0; i < jsArray.size(); i++) {
                    JSValue jsValue = jsArray.get(i);
                    if (!jsValue.isObject()) {
                        continue;
                    }
                    JSObject childObj = jsValue.asObject();
                    String type = childObj.getProperty("type").asString().value();
                    String id = childObj.getProperty("id").asString().value();
                    ViewNode child = mChildrenNode.get(id);
                    if (child == null) {
                        child = ViewNode.create(getDoricContext(), type);
                        child.index = i;
                        child.mParent = this;
                        child.mId = id;
                        mChildrenNode.put(id, child);
                    } else if (i != child.index) {
                        mIndexInfo.remove(i);
                        child.index = i;
                        mView.removeView(child.mView);
                    }
                    ViewGroup.LayoutParams params = child.getLayoutParams();
                    if (params == null) {
                        params = generateDefaultLayoutParams();
                    }
                    child.blend(childObj.getProperty("props").asObject(), params);
                    if (mIndexInfo.get(i) == null) {
                        mView.addView(child.mView, i);
                        mIndexInfo.put(i, child);
                    }
                }
                while (i < mView.getChildCount()) {
                    mView.removeViewAt(mView.getChildCount() - 1);
                    if (mIndexInfo.get(i) != null) {
                        mChildrenNode.remove(mIndexInfo.get(i).getId());
                        mIndexInfo.remove(i);
                    }
                }
                break;
            default:
                super.blend(view, layoutParams, name, prop);
                break;
        }
    }

    protected ViewGroup.LayoutParams generateDefaultLayoutParams() {
        return new ViewGroup.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
    }

    public abstract void blendChild(ViewNode viewNode, JSObject jsObject);
}
