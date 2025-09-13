---
title: 默认模块
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

# 默认模块

Base URLs:

# Authentication

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

<a id="opIdchat"></a>

## POST 对话

POST /api/chat/ai

> Body 请求参数

```json
{
  "sessionId": 0,
  "content": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |none|
|body|body|[ChatRequest](#schemachatrequest)| 是 |none|

> 返回示例

> 200 Response

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|[[ServerSentEventString](#schemaserversenteventstring)]|false|none||none|

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

# 数据模型

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

<h2 id="tocS_ChatRequest">ChatRequest</h2>

<a id="schemachatrequest"></a>
<a id="schema_ChatRequest"></a>
<a id="tocSchatrequest"></a>
<a id="tocschatrequest"></a>

```json
{
  "sessionId": 0,
  "content": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|sessionId|integer(int64)|true|none||none|
|content|string|true|none||none|

<h2 id="tocS_ServerSentEventString">ServerSentEventString</h2>

<a id="schemaserversenteventstring"></a>
<a id="schema_ServerSentEventString"></a>
<a id="tocSserversenteventstring"></a>
<a id="tocsserversenteventstring"></a>

```json
{}

```

### 属性

*None*

