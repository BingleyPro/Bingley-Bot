const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

const { Users } = require('./dbObjects.js');

const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const currency = new Collection();

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.once(Events.ClientReady, async readyClient => {
	const storedBalances = await Users.findAll();
	storedBalances.forEach(b => currency.set(b.user_id, b));

	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// Message event handling
client.on('messageCreate', async message => {
    // Check if the message is sent by a bot or not in a guild
    if (message.author.bot || !message.guild) return;

    // Define XP rewards for different conditions
    let xpToAdd = 0;

    // Check if the message is sent in a certain list of channels
    const allowedChannels = ['1217380741382537287', '1217380777956868238']; // Add your channel IDs here
    if (allowedChannels.includes(message.channel.id)) {
        xpToAdd = 1;
    }

    // Check if the user has a certain role and message is sent in allowed channels
    const userRoles = message.member.roles.cache;
    if (userRoles.some(role => role.name === 'XP 1') && allowedChannels.includes(message.channel.id)) {
        xpToAdd = 2;
    }

    // Check if the user has a different certain role and message is sent in allowed channels
    if (userRoles.some(role => role.name === 'XP 2') && allowedChannels.includes(message.channel.id)) {
        xpToAdd = 5;
    }

    // Add XP to the user
    const user = await Users.findOne({ where: { user_id: message.author.id } });
    if (user) {
        user.XP += xpToAdd;
        await user.save();
    }

	 // Send debug message to a specific channel
	 const debugChannelId = '1217383259714093117';
	 const debugChannel = client.channels.cache.get(debugChannelId);
	 if (debugChannel) {
		 debugChannel.send(`User ${user.username} gained ${amount} XP. Total XP: ${userData.XP}`);
	 }
});

// Voice state update event handling
client.on('voiceStateUpdate', async (oldState, newState) => {
    // Check if the user has left a voice channel and not in the #lounge channel
    if (oldState.channel && oldState.channel.id !== '1217380962439139338') {
        // Calculate the time spent in the voice channel
        const timeSpent = Math.ceil((new Date() - oldState.channel.createdAt) / 60000); // Convert milliseconds to minutes

        // Define XP rewards based on conditions
        let xpToAdd = 0;

        // Check if the user has a certain role and not in the #lounge channel
        const userRoles = newState.member.roles.cache;
        if (userRoles.some(role => role.name === 'XP 1')) {
            xpToAdd = 10;
        }

        // Check if the user has another certain role and not in the #lounge channel
        if (userRoles.some(role => role.name === 'XP 2')) {
            xpToAdd = 30;
        }

        // Add XP to the user
        const user = await Users.findOne({ where: { user_id: newState.member.user.id } });
        if (user) {
            user.XP += xpToAdd * timeSpent; // Multiply XP reward by time spent in minutes
            await user.save();
        }
    }
});

client.login(token);