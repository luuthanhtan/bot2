import * as dotenv from 'dotenv';
import * as path from "path";
import { readdir } from "fs/promises";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname } from 'path';
dotenv.config();
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
import { Client, GatewayIntentBits, Message, TextChannel, GuildMember, Guild, Role, Channel, VoiceChannel, ForumChannel, CategoryChannel, ActivityType, PartialGuildMember } from 'discord.js';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { Chat } from "../models/chat";

interface Config {
  prefix: string;
  mutedRole: string;
  modLogChannel: string;
}

interface CommandExecuteParams {
  message: Message;
  args: string[];
  config: Config;
  logModAction: (action: string) => void;
  sendEmbedMessage: (channel: TextChannel, embedOptions: any) => void;
  client: Client;
  model: GenerativeModel;
  chatM: Chat;
}

const chatM = new Chat();

class ConfigService {
  private config: Config;

  constructor(config?: Config) {
    this.config = config || {
      prefix: '!',
      mutedRole: 'Muted',
      modLogChannel: 'mod-log'
    };
  }

  getConfig(): Config {
    return this.config;
  }

  getPrefix(): string {
    return this.config.prefix;
  }
}

class LoggerService {
  log(message: string): void {
    console.log(message);
  }

  error(message: string, error?: any): void {
    console.error(message, error);
  }
}

class AIService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  getModel(): GenerativeModel {
    return this.model;
  }
}

class CommandService {
  private commands: Map<string, any>;

  constructor() {
    this.commands = new Map();
  }

  async loadCommands(commandFiles: string[]): Promise<void> {
    for (const file of commandFiles) {
      if (!file.endsWith(".js") && !file.endsWith(".ts")) continue;
      if(file.startsWith("types.ts")) continue;
      try {
        const filePath = pathToFileURL(path.join(__dirname, "commands", file)).href;
        const { default: command } = await import(filePath);
        this.commands.set(command.name, command);
        console.log(`✅ Loaded command: ${command.name}`);
      } catch (error) {
        console.error(`❌ Lỗi khi load command ${file}:`, error);
      }
    }
  }

  async executeCommand(
    commandName: string,
    message: Message,
    args: string[],
    config: Config,
    logModAction: (action: string) => void,
    sendEmbedMessage: (channel: TextChannel, embedOptions: any) => void,
    client: Client,
    model: GenerativeModel
  ): Promise<void> {
    const command = this.commands.get(commandName);
    if (!command) return;

    await command.execute({
      message,
      args,
      config,
      logModAction,
      sendEmbedMessage,
      client,
      model,
      chatM
    } as CommandExecuteParams);
  }
}

class ModerationService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  logMemberJoin(member: GuildMember): void {
    const logChannel = member.guild.channels.cache.find(
      channel => channel.name === 'mod-log'
    ) as TextChannel;
    
    if (logChannel) {
      logChannel.send(
        `:inbox_tray: **${member.user.tag}** đã tham gia server. (ID: ${member.id})`
      );
    }
  }

  logMemberLeave(member: GuildMember | PartialGuildMember): void {
    const logChannel = member.guild.channels.cache.find(
      channel => channel.name === 'mod-log'
    ) as TextChannel;
    
    if (logChannel) {
      logChannel.send(
        `:outbox_tray: **${member.user?.tag}** đã rời server. (ID: ${member.id})`
      );
    }
  }

  ensureMutedRoleExists(): void {
    this.client.guilds.cache.forEach((guild: Guild) => {
      let mutedRole = guild.roles.cache.find(role => role.name === 'Muted');
      
      if (!mutedRole) {
        try {
          guild.roles.create({
            name: 'Muted',
            permissions: [],
          }).then((role: Role) => {
            console.log(`Đã tạo role ${role.name} cho server ${guild.name}`);
            guild.channels.cache.forEach((channel: Channel) => {
              if (
                channel instanceof TextChannel ||
                channel instanceof VoiceChannel ||
                channel instanceof ForumChannel ||
                channel instanceof CategoryChannel
              ) {
                channel.permissionOverwrites.create(role, {
                  SendMessages: false,
                  AddReactions: false,
                  Speak: false,
                });
              } else {
                console.error("Channel does not support permission overwrites:", channel.type);
              }
            });
          });
        } catch (error) {
          console.error(`Không thể tạo role Muted cho server ${guild.name}: ${error}`);
        }
      }
    });
  }

  logModAction(action: string): void {
    console.log(`Mod Action: ${action}`);
  }

  sendEmbedMessage(channel: TextChannel, embedOptions: any): void {
    // Triển khai logic gửi embed message
  }
}

class ScheduleService {
  scheduleNextMessage(client: Client): void {
    // Triển khai logic lên lịch tin nhắn 
    console.log('Đã thiết lập lịch tin nhắn');
  }
}

class DiscordBotService {
  private client: Client;
  private configService: ConfigService;
  private loggerService: LoggerService;
  private aiService: AIService;
  private commandService: CommandService;
  private moderationService: ModerationService;
  private scheduleService: ScheduleService;

  constructor(config?: Config) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
      ],
    });

    this.configService = new ConfigService(config);
    this.loggerService = new LoggerService();
    this.aiService = new AIService(process.env.AI_API_KEY || '');
    this.commandService = new CommandService();
    this.moderationService = new ModerationService(this.client);
    this.scheduleService = new ScheduleService();
  }

  async initialize(): Promise<void> {
    await this.loadCommands();
    this.setupEventListeners();
    await this.login();
  }

  async loadCommands(): Promise<void> {
    try {
      const commandFiles = await readdir(path.join(__dirname, "commands"));
      await this.commandService.loadCommands(commandFiles);
      console.log('Đã tải lệnh');
    } catch (error) {
      console.log(error, 'lỗi tải lệnh');
      this.loggerService.error("Lỗi khi tải lệnh:", error);
    }
  }

  setupEventListeners(): void {
    this.client.once('ready', () => {
      this.onBotReady();
    });

    this.client.on('messageCreate', async (message: Message) => {
      await this.onMessageReceived(message);
    });

    this.client.on('guildMemberAdd', (member: GuildMember) => {
      this.moderationService.logMemberJoin(member);
    });

    this.client.on('guildMemberRemove', (member: GuildMember | PartialGuildMember) => {
      this.moderationService.logMemberLeave(member);
    });
  }

  onBotReady(): void {
    this.loggerService.log(`🤖 Bot đã sẵn sàng! Đăng nhập với tên ${this.client.user?.tag}`);
    
    this.client.user?.setActivity('!help để xem lệnh', { type: ActivityType.Watching });
    this.moderationService.ensureMutedRoleExists();
    this.scheduleService.scheduleNextMessage(this.client);
  }

  async onMessageReceived(message: Message): Promise<void> {
    if (message.author.bot || !message.content.startsWith(this.configService.getPrefix())) return;

    const args = message.content.slice(this.configService.getPrefix().length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase() || '';

    try {
      await this.commandService.executeCommand(
        commandName,
        message,
        args,
        this.configService.getConfig(),
        this.moderationService.logModAction,
        this.moderationService.sendEmbedMessage,
        this.client,
        this.aiService.getModel()
      );
    } catch (error) {
      this.loggerService.error('Có lỗi xảy ra khi thực hiện lệnh.', error);
      message.reply('Có lỗi xảy ra khi thực hiện lệnh.');
    }
  }

  async login(): Promise<void> {
    await this.client.login(process.env.DISCORD_TOKEN);
  }
}

export default DiscordBotService;