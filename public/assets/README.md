# Hero 插图

把设计里的 5 张插图放到本目录（文件名必须完全一致）：

    illu-1.png   主视觉 / 底层大图（填满圆角窗口）
    illu-2.png   左上浮动信息卡
    illu-3.png   右下自动轮播卡 1
    illu-4.png   右下自动轮播卡 2
    illu-5.png   右下自动轮播卡 3

放好后页面 Hero 右侧会自动加载（路径为 `/assets/illu-*.png`），
illu-3/4/5 会以 3 秒间隔自动轮播。

替换任意一张即可换图。本目录在 `public/` 下，Vite 会原样按根路径
`/` 提供，无需 import。
