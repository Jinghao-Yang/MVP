我怀疑问题已经不在拖拽逻辑了。

你的 `PopoverCard` 代码本身看起来已经接近正确：

- 不走 React State
- transform: translate3d
- mousemove 直接写 DOM
- pointerup 才同步
- backdrop-filter 拖拽时关闭

这些优化都做了。

下一步不要继续猜。

直接打开 Chrome：

```
F12
→ Performance
→ Record
→ 拖动卡片3秒
→ Stop

```

看时间花在哪里。

重点看：

```
Main
 ├─ Scripting
 ├─ Rendering
 ├─ Painting
 └─ Composite Layers

```

不同结果对应不同病因。

***

## 第一种情况

如果你看到：

```
Rendering 50%
Paint 30%

```

那说明不是 React。

而是 CSS 太重。

我看你的 CSS 已经有几个危险信号：

### body 上的动态背景

```
body {
  background-image:
    linear-gradient(...)
    linear-gradient(...)
    radial-gradient(...)
    radial-gradient(...)
    radial-gradient(...);

  animation: ambient-breath 15s infinite;
}

```

这玩意非常可疑。

因为整个 viewport 每帧都在重绘。

尤其：

```
background-attachment: fixed;

```

这是性能杀手。

先全部注释：

```
background-image: none;
animation: none;
background-attachment: initial;

```

再测。

***

### glass-panel

你虽然拖拽时关闭了：

```
backdrop-filter

```

但其它卡片呢？

如果同时有：

```
20个popover
20个blur

```

浏览器仍然要持续维护合成层。

试试：

```
.glass-panel {
  backdrop-filter: none;
}

```

全部关掉测。

***

## 第二种情况

如果看到：

```
Scripting 80%

```

说明 JS 在跑。

检查：

```
mousemove
 ↓
其它组件更新

```

我怀疑这里。

因为：

```
onMouseEnter
onMouseLeave
onLinkHover
onLinkLeave

```

这些都是父组件传下来的。

如果父组件维护：

```
const [popups, setPopups]

```

那么：

```
hover
 ↓
setState
 ↓
重新render所有popover

```

一样卡。

***

## 第三种情况

如果看到：

```
Layout 60%

```

那你代码里还有地方在强制回流。

例如：

```
getBoundingClientRect()
offsetWidth
offsetHeight
scrollTop

```

这种。

搜全项目：

```
grep -r "getBoundingClientRect"
grep -r "offsetWidth"
grep -r "offsetHeight"

```

看看。

***

## 第四种情况

如果看到：

```
Composite Layers

```

特别高。

说明 GPU 炸了。

你的样式里：

```
box-shadow
backdrop-filter
blur
opacity

```

非常多。

尤其：

```
--shadow-glass:
0 12px 48px -12px rgba(...)

```

这种超大阴影。

拖拽时 GPU 要不断重算。

试试：

```
.dragging-active {
  box-shadow: none !important;
}

```

***

## 我最怀疑的地方

其实不是 PopoverCard。

而是：

```
Tiptap
Canvas
Sidebar
ContextPanel

```

这些组件。

你给我的只是拖拽组件。

但如果父组件长这样：

```
const [popups, setPopups] = useState(...)

```

然后：

```
<PopoverCard
  onMouseEnter={() => setHovered(id)}
/>

```

那么鼠标移动过程中：

```
mousemove
↓
hover状态变化
↓
父组件render
↓
整个树render

```

你拖拽再怎么优化都没用。

***

我现在最想看的是：

1. Chrome Performance 截图
2. PopoverCard 的父组件
3. 保存 popups 的 store（useState/zustand/datascript）

因为以你贴出来的代码来看，拖拽层本身已经不像主要瓶颈了，更像是画布其它部分在每帧跟着一起工作。没有 Performance Timeline，继续改 CSS 基本属于盲修。
