#!/usr/bin/env python3
import os
import sys
import subprocess
from dotenv import load_dotenv
from lark_oapi import Config, DOMAIN_FEISHU
from lark_oapi.im.v1 import MessageReceiveEventHandler, MessageReceiveEvent
from lark_oapi.ws import WsClient

# 导入 OpenClaw 核心（适配你的 Dime 分支）
sys.path.append("/home/hermitwang/Projects/DigitalMe/Dime")
from openclaw import ClawCore, VibeCoding

# ---------------------- 加载配置 + 初始化核心 ----------------------
# 加载飞书配置
load_dotenv("feishu_config.env")
app_id = os.getenv("FEISHU_APP_ID")
app_secret = os.getenv("FEISHU_APP_SECRET")

# 初始化 OpenClaw 核心
claw = ClawCore()
vibe = VibeCoding(claw)

# 初始化飞书配置（本地长连接，无需加密/公网）
# 个人自建应用用 internal_app 配置
feishu_config = Config.new_internal_app_config(
    app_id=app_id,
    app_secret=app_secret
).set_domain(DOMAIN_FEISHU)  # 飞书国内版

# ---------------------- 飞书消息处理核心 ----------------------
def handle_feishu_message(event: MessageReceiveEvent):
    """处理飞书消息，关联 OpenClaw 动作"""
    try:
        # 解析消息内容
        msg = event.message
        sender_id = msg.sender.sender_id.user_id
        # 解析文本消息（兼容新版 SDK）
        msg_content = msg.content if msg.content else ""
        if msg_content.startswith("{"):
            import json
            msg_content = json.loads(msg_content).get("text", "").strip()
        else:
            msg_content = msg_content.strip()
        
        print(f"\n📩 飞书收到消息：{msg_content}（来自：{sender_id}）")
        
        # 1. 触发 OpenClaw 振动反馈（本地交互）
        vibe.trigger(intensity=0.5, duration=0.6)
        
        # 2. 匹配 OpenClaw 指令
        reply_content = ""
        if "整理代码" in msg_content:
            # 执行 OpenClaw 本地动作
            result = claw.execute_action("code_format", params={"path": "./src"})
            reply_content = f"✅ OpenClaw 执行结果：{result}"
        
        elif "系统命令" in msg_content:
            # 执行系统命令（示例：ls -l）
            cmd = msg_content.replace("系统命令", "").strip()
            result = claw.execute_action("system_cmd", params={"cmd": cmd})
            reply_content = f"💻 系统命令执行结果：{result}"
        
        elif "退出" in msg_content:
            reply_content = "👋 OpenClaw 飞书长连接已退出"
            # 关闭长连接
            sys.exit(0)
        
        else:
            reply_content = f"ℹ️ 未匹配指令，你可以发送：整理代码 / 系统命令 [指令] / 退出"
        
        # 3. 回复飞书消息（新版 SDK 写法）
        from lark_oapi.im.v1 import CreateMessageRequest, MessageType
        from lark_oapi.im.v1 import MessageService
        
        # 构建回复请求
        req = CreateMessageRequest.builder() \
            .receive_id(sender_id) \
            .receive_id_type("user_id") \
            .content(f'{{"text":"{reply_content}"}}') \
            .msg_type(MessageType.TEXT) \
            .build()
        
        # 发送回复（新版 SDK 调用方式）
        resp = MessageService.new_instance(feishu_config).create(req)
        if resp.success():
            print(f"✅ 回复飞书消息成功：{reply_content}")
        else:
            print(f"❌ 回复失败：{resp.code} - {resp.msg}")
    
    except Exception as e:
        print(f"❌ 消息处理出错：{str(e)}")

# ---------------------- 启动飞书长连接 ----------------------
if __name__ == "__main__":
    # 启动 OpenClaw 核心
    claw.start()
    print("✅ OpenClaw 核心已启动")
    
    # 注册消息事件处理器
    event_handler = MessageReceiveEventHandler(handle_feishu_message)
    
    # 启动飞书 WebSocket 长连接（本地运行，无需公网）
    ws_client = WsClient.builder() \
        .config(feishu_config) \
        .register_message_receive_handler(event_handler) \
        .build()
    
    print("🔌 飞书长连接客户端启动中...（请确保飞书应用已发布）")
    print("📱 打开飞书，给机器人发送消息即可测试")
    
    # 保持长连接运行
    ws_client.run_forever()
