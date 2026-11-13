# 校园信息港

江苏省张家港中等专业学校校园信息发布站点，分为学生端和教师端。

## 目录

- `index.html`：学生端，手机浏览器优先
- `teacher.html`：教师端，桌面浏览器优先
- `assets/css`：学生端和教师端样式
- `assets/js`：数据、公共逻辑、学生端脚本、教师端脚本
- `assets/images`：新闻照片、视频封面、品牌图形
- `assets/media/videos`：演示视频
- `assets/vendor`：CryptoJS 密码哈希组件

## 本地运行

在“网站源码”目录执行：

```bash
python -m http.server 8322
```

访问：

- 学生端：http://127.0.0.1:8322/index.html
- 教师端：http://127.0.0.1:8322/teacher.html

## 演示账号

- 学生：`student / 123456`
- 学生：`student2 / 123456`
- 教师：`teacher / 123456`

## 部署

把本目录内的文件上传到 GitHub 仓库根目录，在仓库 Settings → Pages 中选择分支根目录发布即可。项目已包含 `.nojekyll`。

更多说明见上一级“说明文档”目录。
