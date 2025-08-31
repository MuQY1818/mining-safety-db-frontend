---
title: mining-db
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
code_clipboard: true
highlight_theme: darkula
headingLevel: 2
generator: "@tarslib/widdershins v4.0.30"

---

# mining-db

Base URLs:

# Authentication

# 用户

<a id="opIdsignup"></a>

## POST 用户注册

POST /api/user/signup

> Body 请求参数

```json
{
  "username": "string",
  "password": "string",
  "realName": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[SignupRequest](#schemasignuprequest)| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultVoid](#schemaajaxresultvoid)|

<a id="opIdgetProfile"></a>

## GET 获取个人信息

GET /api/user/profile

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{"userName":"string","email":"string","realName":"string","phone":"string","avatar":"string","role":"user"}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultGetProfileResponse](#schemaajaxresultgetprofileresponse)|

<a id="opIdeditProfile"></a>

## POST 编辑个人信息

POST /api/user/profile

> Body 请求参数

```json
{
  "username": "string",
  "email": "string",
  "realName": "string",
  "phone": "string",
  "avatar": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |none|
|body|body|[EditProfileRequest](#schemaeditprofilerequest)| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultVoid](#schemaajaxresultvoid)|

<a id="opIdlogin"></a>

## POST 用户登录

POST /api/user/login

> Body 请求参数

```json
{
  "username": "string",
  "password": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[LoginRequest](#schemaloginrequest)| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{"userType":"user","token":"string"}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultLoginResponse](#schemaajaxresultloginresponse)|

# 反馈

<a id="opIdgetFeedbackDetail"></a>

## GET 获取反馈详情

GET /api/feedback

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|feedbackId|query|integer(int64)| 是 |none|
|Authorization|header|string| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{"userId":0,"type":"bug","title":"string","content":"string","contactInfo":"string","status":"pending","reply":"string","createdAt":"2019-08-24T14:15:22Z"}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultGetFeedbackDetailResponse](#schemaajaxresultgetfeedbackdetailresponse)|

<a id="opIdsubmitFeedback"></a>

## POST 提交反馈

POST /api/feedback

> Body 请求参数

```json
{
  "type": "bug",
  "title": "string",
  "content": "string",
  "contactInfo": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |none|
|body|body|[SubmitFeedbackRequest](#schemasubmitfeedbackrequest)| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultVoid](#schemaajaxresultvoid)|

<a id="opIdhandleFeedback"></a>

## POST 处理反馈

POST /api/feedback/handle

> Body 请求参数

```json
{
  "feedbackId": 0,
  "status": "pending",
  "reply": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |none|
|body|body|[HandleFeedbackRequest](#schemahandlefeedbackrequest)| 否 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultVoid](#schemaajaxresultvoid)|

<a id="opIdgetFeedbackList"></a>

## GET 获取反馈列表

GET /api/feedback/list

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|page|query|integer(int32)| 是 |页码|
|pageSize|query|integer(int32)| 是 |每页数量|
|status|query|string| 是 |处理状态: all-全部, pending-待处理, resolved-已处理, closed-已关闭|
|order|query|string| 是 |排序: desc-降序, asc-升序|
|Authorization|header|string| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{"page":0,"pageSize":0,"total":0,"list":[{"id":0,"userId":0,"type":"bug","title":"string","content":"string","contactInfo":"string","status":"pending","reply":"string","createdAt":"2019-08-24T14:15:22Z"}]}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultBaseListResponseGetFeedbackListElement](#schemaajaxresultbaselistresponsegetfeedbacklistelement)|

# 文件

<a id="opIduploadFile"></a>

## POST 上传文件

POST /api/file/upload

> Body 请求参数

```yaml
file: ""

```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |none|
|body|body|object| 否 |none|
|» file|body|string(binary)| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{"url":"string"}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultUploadFileResponse](#schemaajaxresultuploadfileresponse)|

<a id="opIddownloadFile"></a>

## GET 下载文件 用于统计下载次数

GET /api/file/download

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|objectURL|query|string| 是 |none|
|Authorization|header|string| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultVoid](#schemaajaxresultvoid)|

# 安全资料

<a id="opIdgetSafetyDataDetail"></a>

## GET 获取安全资料详情

GET /api/safety-data

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|safetyDataId|query|integer(int64)| 是 |none|
|Authorization|header|string| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{"title":"string","description":"string","safetyLevel":"low","mineType":"coal","category":"gas_detection","viewCount":0,"province":"string","city":"string","district":"string","address":"string","latitude":"string","longitude":"string","downloadUrl":"string","fileSize":"string","fileType":"string","relatedItems":[0],"createdBy":"string","tags":["string"],"createdAt":"2019-08-24T14:15:22Z","downloadCount":0}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultGetSafetyDataDetailResponse](#schemaajaxresultgetsafetydatadetailresponse)|

<a id="opIdupdateSafetyData"></a>

## PUT 修改安全资料

PUT /api/safety-data

> Body 请求参数

```json
{
  "id": 0,
  "title": "string",
  "description": "string",
  "safetyLevel": "low",
  "mineType": "coal",
  "category": "gas_detection",
  "province": "string",
  "city": "string",
  "district": "string",
  "address": "string",
  "longitude": "string",
  "latitude": "string",
  "downloadUrl": "string",
  "fileSize": "string",
  "fileType": "string",
  "relatedItems": [
    0
  ],
  "tags": [
    "string"
  ]
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |none|
|body|body|[UpdateSafetyDataRequest](#schemaupdatesafetydatarequest)| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultVoid](#schemaajaxresultvoid)|

<a id="opIduploadSafetyData"></a>

## POST 上传安全资料

POST /api/safety-data

> Body 请求参数

```json
{
  "title": "string",
  "description": "string",
  "safetyLevel": "low",
  "mineType": "coal",
  "category": "gas_detection",
  "province": "string",
  "city": "string",
  "district": "string",
  "address": "string",
  "longitude": "string",
  "latitude": "string",
  "downloadUrl": "string",
  "fileSize": "string",
  "fileType": "string",
  "relatedItems": [
    0
  ],
  "tags": [
    "string"
  ]
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |none|
|body|body|[UploadSafetyDataRequest](#schemauploadsafetydatarequest)| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultVoid](#schemaajaxresultvoid)|

<a id="opIddeleteSafetyData"></a>

## DELETE 删除安全资料

DELETE /api/safety-data

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|safetyDataId|query|integer(int64)| 是 |none|
|Authorization|header|string| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultVoid](#schemaajaxresultvoid)|

<a id="opIdgetSafetyDataList"></a>

## GET 获取安全资料列表

GET /api/safety-data/list

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|page|query|integer(int32)| 是 |页码|
|pageSize|query|integer(int32)| 是 |每页数量|
|Authorization|header|string| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{"page":0,"pageSize":0,"total":0,"list":[{"id":0,"title":"string","description":"string","safetyLevel":"low","mineType":"coal","category":"gas_detection","viewCount":0,"province":"string","city":"string","district":"string","address":"string","latitude":"string","longitude":"string","downloadUrl":"string","fileSize":"string","fileType":"string","relatedItems":[0],"createdBy":"string","tags":["string"],"createdAt":"2019-08-24T14:15:22Z"}]}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultBaseListResponseGetSafetyDataListElement](#schemaajaxresultbaselistresponsegetsafetydatalistelement)|

# 会话管理

<a id="opIdgetChatMessages"></a>

## GET 获取会话列表

GET /api/chat

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|page|query|integer(int32)| 是 |页码|
|pageSize|query|integer(int32)| 是 |每页数量|
|order|query|string| 是 |排序: desc-降序, asc-升序|
|Authorization|header|string| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{"page":0,"pageSize":0,"total":0,"list":[{"id":0,"title":"string","description":"string","messageCount":0,"createdAt":"2019-08-24T14:15:22Z","updatedAt":"2019-08-24T14:15:22Z"}]}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultBaseListResponseChatSessionResponse](#schemaajaxresultbaselistresponsechatsessionresponse)|

<a id="opIdupdateSession"></a>

## PUT 修改会话

PUT /api/chat

> Body 请求参数

```json
{
  "id": 0,
  "title": "string",
  "description": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |none|
|body|body|[UpdateSessionDataRequest](#schemaupdatesessiondatarequest)| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultVoid](#schemaajaxresultvoid)|

<a id="opIdcreateSession"></a>

## POST 创建新会话

POST /api/chat

> Body 请求参数

```json
{
  "title": "关于瓦斯检测的咨询",
  "description": "询问煤矿瓦斯检测相关问题"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |none|
|body|body|[CreateChatSessionRequest](#schemacreatechatsessionrequest)| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{"sessionId":0}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultCreateSessionResponse](#schemaajaxresultcreatesessionresponse)|

<a id="opIddeleteSession"></a>

## DELETE 删除会话记录

DELETE /api/chat

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|sessionId|query|integer(int64)| 是 |none|
|Authorization|header|string| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultVoid](#schemaajaxresultvoid)|

<a id="opIdgetMessages"></a>

## GET 获取消息历史

GET /api/chat/messages

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|page|query|integer(int32)| 是 |页码|
|pageSize|query|integer(int32)| 是 |每页数量|
|order|query|string| 是 |排序: desc-降序, asc-升序|
|sessionId|query|integer(int64)| 是 |会话ID|
|Authorization|header|string| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{"page":0,"pageSize":0,"total":0,"list":[{"id":0,"role":"user","content":"string","modelName":"string","createdAt":"2019-08-24T14:15:22Z"}]}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultBaseListResponseChatMessageResponse](#schemaajaxresultbaselistresponsechatmessageresponse)|

<a id="opIdsaveMessages"></a>

## POST 保存消息

POST /api/chat/messages

> Body 请求参数

```json
{
  "sessionId": 0,
  "role": "user",
  "content": "string",
  "modelName": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |none|
|body|body|[SaveMessageRequest](#schemasavemessagerequest)| 是 |none|

> 返回示例

> 200 Response

```
{"code":0,"msg":"string","data":{}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[AjaxResultVoid](#schemaajaxresultvoid)|

# 数据模型

<h2 id="tocS_LoginRequest">LoginRequest</h2>

<a id="schemaloginrequest"></a>
<a id="schema_LoginRequest"></a>
<a id="tocSloginrequest"></a>
<a id="tocsloginrequest"></a>

```json
{
  "username": "string",
  "password": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|username|string|true|none||用户名|
|password|string|true|none||密码|

<h2 id="tocS_AjaxResultLoginResponse">AjaxResultLoginResponse</h2>

<a id="schemaajaxresultloginresponse"></a>
<a id="schema_AjaxResultLoginResponse"></a>
<a id="tocSajaxresultloginresponse"></a>
<a id="tocsajaxresultloginresponse"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "userType": "user",
    "token": "string"
  }
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer(int32)|false|none||none|
|msg|string|false|none||none|
|data|[LoginResponse](#schemaloginresponse)|false|none||none|

<h2 id="tocS_LoginResponse">LoginResponse</h2>

<a id="schemaloginresponse"></a>
<a id="schema_LoginResponse"></a>
<a id="tocSloginresponse"></a>
<a id="tocsloginresponse"></a>

```json
{
  "userType": "user",
  "token": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|userType|string|false|none||用户类型|
|token|string|false|none||JWT token|

#### 枚举值

|属性|值|
|---|---|
|userType|user|
|userType|admin|

<h2 id="tocS_SignupRequest">SignupRequest</h2>

<a id="schemasignuprequest"></a>
<a id="schema_SignupRequest"></a>
<a id="tocSsignuprequest"></a>
<a id="tocssignuprequest"></a>

```json
{
  "username": "string",
  "password": "string",
  "realName": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|username|string|true|none||用户名|
|password|string|true|none||密码|
|realName|string|true|none||真实姓名|

<h2 id="tocS_AjaxResultVoid">AjaxResultVoid</h2>

<a id="schemaajaxresultvoid"></a>
<a id="schema_AjaxResultVoid"></a>
<a id="tocSajaxresultvoid"></a>
<a id="tocsajaxresultvoid"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": {}
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer(int32)|false|none||none|
|msg|string|false|none||none|
|data|object|false|none||none|

<h2 id="tocS_EditProfileRequest">EditProfileRequest</h2>

<a id="schemaeditprofilerequest"></a>
<a id="schema_EditProfileRequest"></a>
<a id="tocSeditprofilerequest"></a>
<a id="tocseditprofilerequest"></a>

```json
{
  "username": "string",
  "email": "string",
  "realName": "string",
  "phone": "string",
  "avatar": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|username|string|true|none||none|
|email|string|true|none||none|
|realName|string|true|none||none|
|phone|string|true|none||none|
|avatar|string|true|none||none|

<h2 id="tocS_AjaxResultGetProfileResponse">AjaxResultGetProfileResponse</h2>

<a id="schemaajaxresultgetprofileresponse"></a>
<a id="schema_AjaxResultGetProfileResponse"></a>
<a id="tocSajaxresultgetprofileresponse"></a>
<a id="tocsajaxresultgetprofileresponse"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "userName": "string",
    "email": "string",
    "realName": "string",
    "phone": "string",
    "avatar": "string",
    "role": "user"
  }
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer(int32)|false|none||none|
|msg|string|false|none||none|
|data|[GetProfileResponse](#schemagetprofileresponse)|false|none||none|

<h2 id="tocS_GetProfileResponse">GetProfileResponse</h2>

<a id="schemagetprofileresponse"></a>
<a id="schema_GetProfileResponse"></a>
<a id="tocSgetprofileresponse"></a>
<a id="tocsgetprofileresponse"></a>

```json
{
  "userName": "string",
  "email": "string",
  "realName": "string",
  "phone": "string",
  "avatar": "string",
  "role": "user"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|userName|string|false|none||none|
|email|string|false|none||none|
|realName|string|false|none||none|
|phone|string|false|none||none|
|avatar|string|false|none||none|
|role|string|false|none||none|

#### 枚举值

|属性|值|
|---|---|
|role|user|
|role|admin|

<h2 id="tocS_SubmitFeedbackRequest">SubmitFeedbackRequest</h2>

<a id="schemasubmitfeedbackrequest"></a>
<a id="schema_SubmitFeedbackRequest"></a>
<a id="tocSsubmitfeedbackrequest"></a>
<a id="tocssubmitfeedbackrequest"></a>

```json
{
  "type": "bug",
  "title": "string",
  "content": "string",
  "contactInfo": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|type|string|true|none||反馈类型|
|title|string|true|none||标题|
|content|string|true|none||内容|
|contactInfo|string|false|none||联系信息|

#### 枚举值

|属性|值|
|---|---|
|type|bug|
|type|feature|
|type|improvement|
|type|other|

<h2 id="tocS_GetFeedbackListRequest">GetFeedbackListRequest</h2>

<a id="schemagetfeedbacklistrequest"></a>
<a id="schema_GetFeedbackListRequest"></a>
<a id="tocSgetfeedbacklistrequest"></a>
<a id="tocsgetfeedbacklistrequest"></a>

```json
{
  "page": 1,
  "pageSize": 1,
  "status": "string",
  "order": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|page|integer(int32)|true|none||页码|
|pageSize|integer(int32)|true|none||每页数量|
|status|string|true|none||处理状态: all-全部, pending-待处理, resolved-已处理, closed-已关闭|
|order|string|true|none||排序: desc-降序, asc-升序|

<h2 id="tocS_AjaxResultBaseListResponseGetFeedbackListElement">AjaxResultBaseListResponseGetFeedbackListElement</h2>

<a id="schemaajaxresultbaselistresponsegetfeedbacklistelement"></a>
<a id="schema_AjaxResultBaseListResponseGetFeedbackListElement"></a>
<a id="tocSajaxresultbaselistresponsegetfeedbacklistelement"></a>
<a id="tocsajaxresultbaselistresponsegetfeedbacklistelement"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "page": 0,
    "pageSize": 0,
    "total": 0,
    "list": [
      {
        "id": 0,
        "userId": 0,
        "type": "bug",
        "title": "string",
        "content": "string",
        "contactInfo": "string",
        "status": "pending",
        "reply": "string",
        "createdAt": "2019-08-24T14:15:22Z"
      }
    ]
  }
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer(int32)|false|none||none|
|msg|string|false|none||none|
|data|[BaseListResponseGetFeedbackListElement](#schemabaselistresponsegetfeedbacklistelement)|false|none||none|

<h2 id="tocS_BaseListResponseGetFeedbackListElement">BaseListResponseGetFeedbackListElement</h2>

<a id="schemabaselistresponsegetfeedbacklistelement"></a>
<a id="schema_BaseListResponseGetFeedbackListElement"></a>
<a id="tocSbaselistresponsegetfeedbacklistelement"></a>
<a id="tocsbaselistresponsegetfeedbacklistelement"></a>

```json
{
  "page": 0,
  "pageSize": 0,
  "total": 0,
  "list": [
    {
      "id": 0,
      "userId": 0,
      "type": "bug",
      "title": "string",
      "content": "string",
      "contactInfo": "string",
      "status": "pending",
      "reply": "string",
      "createdAt": "2019-08-24T14:15:22Z"
    }
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|page|integer(int32)|false|none||页码|
|pageSize|integer(int32)|false|none||每页数量|
|total|integer(int64)|false|none||总数|
|list|[[GetFeedbackListElement](#schemagetfeedbacklistelement)]|false|none||列表|

<h2 id="tocS_GetFeedbackListElement">GetFeedbackListElement</h2>

<a id="schemagetfeedbacklistelement"></a>
<a id="schema_GetFeedbackListElement"></a>
<a id="tocSgetfeedbacklistelement"></a>
<a id="tocsgetfeedbacklistelement"></a>

```json
{
  "id": 0,
  "userId": 0,
  "type": "bug",
  "title": "string",
  "content": "string",
  "contactInfo": "string",
  "status": "pending",
  "reply": "string",
  "createdAt": "2019-08-24T14:15:22Z"
}

```

列表

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|false|none||反馈ID|
|userId|integer(int64)|false|none||用户ID|
|type|string|false|none||反馈类型|
|title|string|false|none||标题|
|content|string|false|none||内容|
|contactInfo|string|false|none||联系信息|
|status|string|false|none||状态|
|reply|string|false|none||管理员回复|
|createdAt|string(date-time)|false|none||反馈时间|

#### 枚举值

|属性|值|
|---|---|
|type|bug|
|type|feature|
|type|improvement|
|type|other|
|status|pending|
|status|resolved|
|status|closed|

<h2 id="tocS_AjaxResultUploadFileResponse">AjaxResultUploadFileResponse</h2>

<a id="schemaajaxresultuploadfileresponse"></a>
<a id="schema_AjaxResultUploadFileResponse"></a>
<a id="tocSajaxresultuploadfileresponse"></a>
<a id="tocsajaxresultuploadfileresponse"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "url": "string"
  }
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer(int32)|false|none||none|
|msg|string|false|none||none|
|data|[UploadFileResponse](#schemauploadfileresponse)|false|none||none|

<h2 id="tocS_UploadFileResponse">UploadFileResponse</h2>

<a id="schemauploadfileresponse"></a>
<a id="schema_UploadFileResponse"></a>
<a id="tocSuploadfileresponse"></a>
<a id="tocsuploadfileresponse"></a>

```json
{
  "url": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|url|string|false|none||none|

<h2 id="tocS_AjaxResultGetFeedbackDetailResponse">AjaxResultGetFeedbackDetailResponse</h2>

<a id="schemaajaxresultgetfeedbackdetailresponse"></a>
<a id="schema_AjaxResultGetFeedbackDetailResponse"></a>
<a id="tocSajaxresultgetfeedbackdetailresponse"></a>
<a id="tocsajaxresultgetfeedbackdetailresponse"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "userId": 0,
    "type": "bug",
    "title": "string",
    "content": "string",
    "contactInfo": "string",
    "status": "pending",
    "reply": "string",
    "createdAt": "2019-08-24T14:15:22Z"
  }
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer(int32)|false|none||none|
|msg|string|false|none||none|
|data|[GetFeedbackDetailResponse](#schemagetfeedbackdetailresponse)|false|none||none|

<h2 id="tocS_GetFeedbackDetailResponse">GetFeedbackDetailResponse</h2>

<a id="schemagetfeedbackdetailresponse"></a>
<a id="schema_GetFeedbackDetailResponse"></a>
<a id="tocSgetfeedbackdetailresponse"></a>
<a id="tocsgetfeedbackdetailresponse"></a>

```json
{
  "userId": 0,
  "type": "bug",
  "title": "string",
  "content": "string",
  "contactInfo": "string",
  "status": "pending",
  "reply": "string",
  "createdAt": "2019-08-24T14:15:22Z"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|userId|integer(int64)|false|none||none|
|type|string|false|none||none|
|title|string|false|none||none|
|content|string|false|none||none|
|contactInfo|string|false|none||none|
|status|string|false|none||none|
|reply|string|false|none||none|
|createdAt|string(date-time)|false|none||none|

#### 枚举值

|属性|值|
|---|---|
|type|bug|
|type|feature|
|type|improvement|
|type|other|
|status|pending|
|status|resolved|
|status|closed|

<h2 id="tocS_UploadSafetyDataRequest">UploadSafetyDataRequest</h2>

<a id="schemauploadsafetydatarequest"></a>
<a id="schema_UploadSafetyDataRequest"></a>
<a id="tocSuploadsafetydatarequest"></a>
<a id="tocsuploadsafetydatarequest"></a>

```json
{
  "title": "string",
  "description": "string",
  "safetyLevel": "low",
  "mineType": "coal",
  "category": "gas_detection",
  "province": "string",
  "city": "string",
  "district": "string",
  "address": "string",
  "longitude": "string",
  "latitude": "string",
  "downloadUrl": "string",
  "fileSize": "string",
  "fileType": "string",
  "relatedItems": [
    0
  ],
  "tags": [
    "string"
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|title|string|true|none||标题|
|description|string|true|none||描述|
|safetyLevel|string|true|none||安全等级|
|mineType|string|true|none||矿山类型|
|category|string|true|none||分类|
|province|string|true|none||省份|
|city|string|true|none||城市|
|district|string|true|none||区县|
|address|string|true|none||详细地址|
|longitude|string|true|none||经度|
|latitude|string|true|none||纬度|
|downloadUrl|string|true|none||下载链接|
|fileSize|string|true|none||文件大小|
|fileType|string|true|none||文件类型|
|relatedItems|[integer]|true|none||相关项目ID|
|tags|[string]|true|none||标签|

#### 枚举值

|属性|值|
|---|---|
|safetyLevel|low|
|safetyLevel|medium|
|safetyLevel|high|
|safetyLevel|critical|
|mineType|coal|
|mineType|metal|
|mineType|nonmetal|
|mineType|openpit|
|category|gas_detection|
|category|equipment_safety|
|category|emergency_response|
|category|safety_training|
|category|accident_prevention|
|category|environmental_protection|

<h2 id="tocS_GetSafetyDataListRequest">GetSafetyDataListRequest</h2>

<a id="schemagetsafetydatalistrequest"></a>
<a id="schema_GetSafetyDataListRequest"></a>
<a id="tocSgetsafetydatalistrequest"></a>
<a id="tocsgetsafetydatalistrequest"></a>

```json
{
  "page": 1,
  "pageSize": 1
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|page|integer(int32)|true|none||页码|
|pageSize|integer(int32)|true|none||每页数量|

<h2 id="tocS_AjaxResultBaseListResponseGetSafetyDataListElement">AjaxResultBaseListResponseGetSafetyDataListElement</h2>

<a id="schemaajaxresultbaselistresponsegetsafetydatalistelement"></a>
<a id="schema_AjaxResultBaseListResponseGetSafetyDataListElement"></a>
<a id="tocSajaxresultbaselistresponsegetsafetydatalistelement"></a>
<a id="tocsajaxresultbaselistresponsegetsafetydatalistelement"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "page": 0,
    "pageSize": 0,
    "total": 0,
    "list": [
      {
        "id": 0,
        "title": "string",
        "description": "string",
        "safetyLevel": "low",
        "mineType": "coal",
        "category": "gas_detection",
        "viewCount": 0,
        "province": "string",
        "city": "string",
        "district": "string",
        "address": "string",
        "latitude": "string",
        "longitude": "string",
        "downloadUrl": "string",
        "fileSize": "string",
        "fileType": "string",
        "relatedItems": [
          0
        ],
        "createdBy": "string",
        "tags": [
          "string"
        ],
        "createdAt": "2019-08-24T14:15:22Z"
      }
    ]
  }
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer(int32)|false|none||none|
|msg|string|false|none||none|
|data|[BaseListResponseGetSafetyDataListElement](#schemabaselistresponsegetsafetydatalistelement)|false|none||none|

<h2 id="tocS_BaseListResponseGetSafetyDataListElement">BaseListResponseGetSafetyDataListElement</h2>

<a id="schemabaselistresponsegetsafetydatalistelement"></a>
<a id="schema_BaseListResponseGetSafetyDataListElement"></a>
<a id="tocSbaselistresponsegetsafetydatalistelement"></a>
<a id="tocsbaselistresponsegetsafetydatalistelement"></a>

```json
{
  "page": 0,
  "pageSize": 0,
  "total": 0,
  "list": [
    {
      "id": 0,
      "title": "string",
      "description": "string",
      "safetyLevel": "low",
      "mineType": "coal",
      "category": "gas_detection",
      "viewCount": 0,
      "province": "string",
      "city": "string",
      "district": "string",
      "address": "string",
      "latitude": "string",
      "longitude": "string",
      "downloadUrl": "string",
      "fileSize": "string",
      "fileType": "string",
      "relatedItems": [
        0
      ],
      "createdBy": "string",
      "tags": [
        "string"
      ],
      "createdAt": "2019-08-24T14:15:22Z"
    }
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|page|integer(int32)|false|none||页码|
|pageSize|integer(int32)|false|none||每页数量|
|total|integer(int64)|false|none||总数|
|list|[[GetSafetyDataListElement](#schemagetsafetydatalistelement)]|false|none||列表|

<h2 id="tocS_GetSafetyDataListElement">GetSafetyDataListElement</h2>

<a id="schemagetsafetydatalistelement"></a>
<a id="schema_GetSafetyDataListElement"></a>
<a id="tocSgetsafetydatalistelement"></a>
<a id="tocsgetsafetydatalistelement"></a>

```json
{
  "id": 0,
  "title": "string",
  "description": "string",
  "safetyLevel": "low",
  "mineType": "coal",
  "category": "gas_detection",
  "viewCount": 0,
  "province": "string",
  "city": "string",
  "district": "string",
  "address": "string",
  "latitude": "string",
  "longitude": "string",
  "downloadUrl": "string",
  "fileSize": "string",
  "fileType": "string",
  "relatedItems": [
    0
  ],
  "createdBy": "string",
  "tags": [
    "string"
  ],
  "createdAt": "2019-08-24T14:15:22Z"
}

```

列表

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|false|none||安全数据ID|
|title|string|false|none||标题|
|description|string|false|none||描述|
|safetyLevel|string|false|none||安全等级|
|mineType|string|false|none||矿山类型|
|category|string|false|none||分类|
|viewCount|integer(int32)|false|none||查看次数|
|province|string|false|none||省份|
|city|string|false|none||城市|
|district|string|false|none||区县|
|address|string|false|none||详细地址|
|latitude|string|false|none||经度|
|longitude|string|false|none||纬度|
|downloadUrl|string|false|none||下载链接|
|fileSize|string|false|none||文件大小|
|fileType|string|false|none||文件类型|
|relatedItems|[integer]|false|none||相关项目ID|
|createdBy|string|false|none||创建者姓名|
|tags|[string]|false|none||标签|
|createdAt|string(date-time)|false|none||创建时间|

#### 枚举值

|属性|值|
|---|---|
|safetyLevel|low|
|safetyLevel|medium|
|safetyLevel|high|
|safetyLevel|critical|
|mineType|coal|
|mineType|metal|
|mineType|nonmetal|
|mineType|openpit|
|category|gas_detection|
|category|equipment_safety|
|category|emergency_response|
|category|safety_training|
|category|accident_prevention|
|category|environmental_protection|

<h2 id="tocS_AjaxResultGetSafetyDataDetailResponse">AjaxResultGetSafetyDataDetailResponse</h2>

<a id="schemaajaxresultgetsafetydatadetailresponse"></a>
<a id="schema_AjaxResultGetSafetyDataDetailResponse"></a>
<a id="tocSajaxresultgetsafetydatadetailresponse"></a>
<a id="tocsajaxresultgetsafetydatadetailresponse"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "title": "string",
    "description": "string",
    "safetyLevel": "low",
    "mineType": "coal",
    "category": "gas_detection",
    "viewCount": 0,
    "province": "string",
    "city": "string",
    "district": "string",
    "address": "string",
    "latitude": "string",
    "longitude": "string",
    "downloadUrl": "string",
    "fileSize": "string",
    "fileType": "string",
    "relatedItems": [
      0
    ],
    "createdBy": "string",
    "tags": [
      "string"
    ],
    "createdAt": "2019-08-24T14:15:22Z",
    "downloadCount": 0
  }
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer(int32)|false|none||none|
|msg|string|false|none||none|
|data|[GetSafetyDataDetailResponse](#schemagetsafetydatadetailresponse)|false|none||none|

<h2 id="tocS_GetSafetyDataDetailResponse">GetSafetyDataDetailResponse</h2>

<a id="schemagetsafetydatadetailresponse"></a>
<a id="schema_GetSafetyDataDetailResponse"></a>
<a id="tocSgetsafetydatadetailresponse"></a>
<a id="tocsgetsafetydatadetailresponse"></a>

```json
{
  "title": "string",
  "description": "string",
  "safetyLevel": "low",
  "mineType": "coal",
  "category": "gas_detection",
  "viewCount": 0,
  "province": "string",
  "city": "string",
  "district": "string",
  "address": "string",
  "latitude": "string",
  "longitude": "string",
  "downloadUrl": "string",
  "fileSize": "string",
  "fileType": "string",
  "relatedItems": [
    0
  ],
  "createdBy": "string",
  "tags": [
    "string"
  ],
  "createdAt": "2019-08-24T14:15:22Z",
  "downloadCount": 0
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|title|string|false|none||标题|
|description|string|false|none||描述|
|safetyLevel|string|false|none||安全等级|
|mineType|string|false|none||矿山类型|
|category|string|false|none||分类|
|viewCount|integer(int32)|false|none||查看次数|
|province|string|false|none||省份|
|city|string|false|none||城市|
|district|string|false|none||区县|
|address|string|false|none||详细地址|
|latitude|string|false|none||经度|
|longitude|string|false|none||纬度|
|downloadUrl|string|false|none||下载链接|
|fileSize|string|false|none||文件大小|
|fileType|string|false|none||文件类型|
|relatedItems|[integer]|false|none||相关项目ID|
|createdBy|string|false|none||创建者姓名|
|tags|[string]|false|none||标签|
|createdAt|string(date-time)|false|none||创建时间|
|downloadCount|integer(int32)|false|none||文件下载次数|

#### 枚举值

|属性|值|
|---|---|
|safetyLevel|low|
|safetyLevel|medium|
|safetyLevel|high|
|safetyLevel|critical|
|mineType|coal|
|mineType|metal|
|mineType|nonmetal|
|mineType|openpit|
|category|gas_detection|
|category|equipment_safety|
|category|emergency_response|
|category|safety_training|
|category|accident_prevention|
|category|environmental_protection|

<h2 id="tocS_UpdateSafetyDataRequest">UpdateSafetyDataRequest</h2>

<a id="schemaupdatesafetydatarequest"></a>
<a id="schema_UpdateSafetyDataRequest"></a>
<a id="tocSupdatesafetydatarequest"></a>
<a id="tocsupdatesafetydatarequest"></a>

```json
{
  "id": 0,
  "title": "string",
  "description": "string",
  "safetyLevel": "low",
  "mineType": "coal",
  "category": "gas_detection",
  "province": "string",
  "city": "string",
  "district": "string",
  "address": "string",
  "longitude": "string",
  "latitude": "string",
  "downloadUrl": "string",
  "fileSize": "string",
  "fileType": "string",
  "relatedItems": [
    0
  ],
  "tags": [
    "string"
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|true|none||none|
|title|string|true|none||标题|
|description|string|true|none||描述|
|safetyLevel|string|true|none||安全等级|
|mineType|string|true|none||矿山类型|
|category|string|true|none||分类|
|province|string|true|none||省份|
|city|string|true|none||城市|
|district|string|true|none||区县|
|address|string|true|none||详细地址|
|longitude|string|true|none||经度|
|latitude|string|true|none||纬度|
|downloadUrl|string|true|none||下载链接|
|fileSize|string|true|none||文件大小|
|fileType|string|true|none||文件类型|
|relatedItems|[integer]|true|none||相关项目ID|
|tags|[string]|true|none||标签|

#### 枚举值

|属性|值|
|---|---|
|safetyLevel|low|
|safetyLevel|medium|
|safetyLevel|high|
|safetyLevel|critical|
|mineType|coal|
|mineType|metal|
|mineType|nonmetal|
|mineType|openpit|
|category|gas_detection|
|category|equipment_safety|
|category|emergency_response|
|category|safety_training|
|category|accident_prevention|
|category|environmental_protection|

<h2 id="tocS_CreateChatSessionRequest">CreateChatSessionRequest</h2>

<a id="schemacreatechatsessionrequest"></a>
<a id="schema_CreateChatSessionRequest"></a>
<a id="tocScreatechatsessionrequest"></a>
<a id="tocscreatechatsessionrequest"></a>

```json
{
  "title": "关于瓦斯检测的咨询",
  "description": "询问煤矿瓦斯检测相关问题"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|title|string|true|none||会话标题|
|description|string|false|none||会话描述（可选）|

<h2 id="tocS_UpdateSessionDataRequest">UpdateSessionDataRequest</h2>

<a id="schemaupdatesessiondatarequest"></a>
<a id="schema_UpdateSessionDataRequest"></a>
<a id="tocSupdatesessiondatarequest"></a>
<a id="tocsupdatesessiondatarequest"></a>

```json
{
  "id": 0,
  "title": "string",
  "description": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|true|none||会话id|
|title|string|true|none||标题|
|description|string|true|none||描述|

<h2 id="tocS_AjaxResultCreateSessionResponse">AjaxResultCreateSessionResponse</h2>

<a id="schemaajaxresultcreatesessionresponse"></a>
<a id="schema_AjaxResultCreateSessionResponse"></a>
<a id="tocSajaxresultcreatesessionresponse"></a>
<a id="tocsajaxresultcreatesessionresponse"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "sessionId": 0
  }
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer(int32)|false|none||none|
|msg|string|false|none||none|
|data|[CreateSessionResponse](#schemacreatesessionresponse)|false|none||none|

<h2 id="tocS_CreateSessionResponse">CreateSessionResponse</h2>

<a id="schemacreatesessionresponse"></a>
<a id="schema_CreateSessionResponse"></a>
<a id="tocScreatesessionresponse"></a>
<a id="tocscreatesessionresponse"></a>

```json
{
  "sessionId": 0
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|sessionId|integer(int64)|false|none||none|

<h2 id="tocS_SaveMessageRequest">SaveMessageRequest</h2>

<a id="schemasavemessagerequest"></a>
<a id="schema_SaveMessageRequest"></a>
<a id="tocSsavemessagerequest"></a>
<a id="tocssavemessagerequest"></a>

```json
{
  "sessionId": 0,
  "role": "user",
  "content": "string",
  "modelName": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|sessionId|integer(int64)|true|none||none|
|role|string|true|none||none|
|content|string|true|none||none|
|modelName|string|false|none||none|

#### 枚举值

|属性|值|
|---|---|
|role|user|
|role|assistant|
|role|system|

<h2 id="tocS_GetChatSessionRequest">GetChatSessionRequest</h2>

<a id="schemagetchatsessionrequest"></a>
<a id="schema_GetChatSessionRequest"></a>
<a id="tocSgetchatsessionrequest"></a>
<a id="tocsgetchatsessionrequest"></a>

```json
{
  "page": 1,
  "pageSize": 1,
  "order": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|page|integer(int32)|true|none||页码|
|pageSize|integer(int32)|true|none||每页数量|
|order|string|true|none||排序: desc-降序, asc-升序|

<h2 id="tocS_AjaxResultBaseListResponseChatSessionResponse">AjaxResultBaseListResponseChatSessionResponse</h2>

<a id="schemaajaxresultbaselistresponsechatsessionresponse"></a>
<a id="schema_AjaxResultBaseListResponseChatSessionResponse"></a>
<a id="tocSajaxresultbaselistresponsechatsessionresponse"></a>
<a id="tocsajaxresultbaselistresponsechatsessionresponse"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "page": 0,
    "pageSize": 0,
    "total": 0,
    "list": [
      {
        "id": 0,
        "title": "string",
        "description": "string",
        "messageCount": 0,
        "createdAt": "2019-08-24T14:15:22Z",
        "updatedAt": "2019-08-24T14:15:22Z"
      }
    ]
  }
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer(int32)|false|none||none|
|msg|string|false|none||none|
|data|[BaseListResponseChatSessionResponse](#schemabaselistresponsechatsessionresponse)|false|none||none|

<h2 id="tocS_BaseListResponseChatSessionResponse">BaseListResponseChatSessionResponse</h2>

<a id="schemabaselistresponsechatsessionresponse"></a>
<a id="schema_BaseListResponseChatSessionResponse"></a>
<a id="tocSbaselistresponsechatsessionresponse"></a>
<a id="tocsbaselistresponsechatsessionresponse"></a>

```json
{
  "page": 0,
  "pageSize": 0,
  "total": 0,
  "list": [
    {
      "id": 0,
      "title": "string",
      "description": "string",
      "messageCount": 0,
      "createdAt": "2019-08-24T14:15:22Z",
      "updatedAt": "2019-08-24T14:15:22Z"
    }
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|page|integer(int32)|false|none||页码|
|pageSize|integer(int32)|false|none||每页数量|
|total|integer(int64)|false|none||总数|
|list|[[ChatSessionResponse](#schemachatsessionresponse)]|false|none||列表|

<h2 id="tocS_ChatSessionResponse">ChatSessionResponse</h2>

<a id="schemachatsessionresponse"></a>
<a id="schema_ChatSessionResponse"></a>
<a id="tocSchatsessionresponse"></a>
<a id="tocschatsessionresponse"></a>

```json
{
  "id": 0,
  "title": "string",
  "description": "string",
  "messageCount": 0,
  "createdAt": "2019-08-24T14:15:22Z",
  "updatedAt": "2019-08-24T14:15:22Z"
}

```

列表

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|true|none||会话id|
|title|string|true|none||标题|
|description|string|true|none||描述|
|messageCount|integer(int32)|true|none||信息数量|
|createdAt|string(date-time)|false|none||创建时间|
|updatedAt|string(date-time)|false|none||更新时间|

<h2 id="tocS_GetChatMessageRequest">GetChatMessageRequest</h2>

<a id="schemagetchatmessagerequest"></a>
<a id="schema_GetChatMessageRequest"></a>
<a id="tocSgetchatmessagerequest"></a>
<a id="tocsgetchatmessagerequest"></a>

```json
{
  "page": 1,
  "pageSize": 1,
  "order": "string",
  "sessionId": 0
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|page|integer(int32)|true|none||页码|
|pageSize|integer(int32)|true|none||每页数量|
|order|string|true|none||排序: desc-降序, asc-升序|
|sessionId|integer(int64)|true|none||会话ID|

<h2 id="tocS_AjaxResultBaseListResponseChatMessageResponse">AjaxResultBaseListResponseChatMessageResponse</h2>

<a id="schemaajaxresultbaselistresponsechatmessageresponse"></a>
<a id="schema_AjaxResultBaseListResponseChatMessageResponse"></a>
<a id="tocSajaxresultbaselistresponsechatmessageresponse"></a>
<a id="tocsajaxresultbaselistresponsechatmessageresponse"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "page": 0,
    "pageSize": 0,
    "total": 0,
    "list": [
      {
        "id": 0,
        "role": "user",
        "content": "string",
        "modelName": "string",
        "createdAt": "2019-08-24T14:15:22Z"
      }
    ]
  }
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer(int32)|false|none||none|
|msg|string|false|none||none|
|data|[BaseListResponseChatMessageResponse](#schemabaselistresponsechatmessageresponse)|false|none||none|

<h2 id="tocS_BaseListResponseChatMessageResponse">BaseListResponseChatMessageResponse</h2>

<a id="schemabaselistresponsechatmessageresponse"></a>
<a id="schema_BaseListResponseChatMessageResponse"></a>
<a id="tocSbaselistresponsechatmessageresponse"></a>
<a id="tocsbaselistresponsechatmessageresponse"></a>

```json
{
  "page": 0,
  "pageSize": 0,
  "total": 0,
  "list": [
    {
      "id": 0,
      "role": "user",
      "content": "string",
      "modelName": "string",
      "createdAt": "2019-08-24T14:15:22Z"
    }
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|page|integer(int32)|false|none||页码|
|pageSize|integer(int32)|false|none||每页数量|
|total|integer(int64)|false|none||总数|
|list|[[ChatMessageResponse](#schemachatmessageresponse)]|false|none||列表|

<h2 id="tocS_ChatMessageResponse">ChatMessageResponse</h2>

<a id="schemachatmessageresponse"></a>
<a id="schema_ChatMessageResponse"></a>
<a id="tocSchatmessageresponse"></a>
<a id="tocschatmessageresponse"></a>

```json
{
  "id": 0,
  "role": "user",
  "content": "string",
  "modelName": "string",
  "createdAt": "2019-08-24T14:15:22Z"
}

```

列表

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|false|none||消息ID|
|role|string|false|none||消息角色|
|content|string|false|none||消息内容|
|modelName|string|false|none||模型名称|
|createdAt|string(date-time)|false|none||创建时间|

#### 枚举值

|属性|值|
|---|---|
|role|user|
|role|assistant|
|role|system|

<h2 id="tocS_HandleFeedbackRequest">HandleFeedbackRequest</h2>

<a id="schemahandlefeedbackrequest"></a>
<a id="schema_HandleFeedbackRequest"></a>
<a id="tocShandlefeedbackrequest"></a>
<a id="tocshandlefeedbackrequest"></a>

```json
{
  "feedbackId": 0,
  "status": "pending",
  "reply": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|feedbackId|integer(int64)|false|none||none|
|status|string|false|none||none|
|reply|string|false|none||none|

#### 枚举值

|属性|值|
|---|---|
|status|pending|
|status|resolved|
|status|closed|
