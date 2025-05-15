import { ActionPanel, Action, Icon, List, useNavigation, showToast, Toast } from "@raycast/api"
import { exec } from "child_process"

const options = ['Turn off', 'Turn on']
const lights = ['Living room', 'Closet']

const ITEMS = lights.map((key) => ({
  id: key,
  icon: Icon.Bird,
  title: key,
  subtitle: "Subtitle",
  accessory: "Accessory",
}))

export default function Command() {
  return <LightsList />
}

function LightsList() {
  const { push } = useNavigation()

  return (
    <List>
      {ITEMS.map((item) => (
        <List.Item
          key={item.id}
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
          accessories={[{ icon: Icon.Text, text: item.accessory }]}
          actions={
            <ActionPanel>
              <Action
                title="Show Options"
                onAction={() => push(<LightOptions title={item.title} />)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  )
}

function LightOptions({ title }) {
  function sendUDPCommand(command) {
    const state = command === 'Turn on' ? true : false
    const json = JSON.stringify({
      id: 1,
      method: 'setState',
      params: { state }
    })

    const udpHost = "192.168.1.37"
    const udpPort = "38899"

    // Quote the entire JSON, and send it with echo and netcat
    const cmd = `echo '${json}' | nc -u -w 1 ${udpHost} ${udpPort}`

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        showToast({ style: Toast.Style.Failure, title: "UDP Command Failed", message: stderr })
        return
      }
      showToast({ style: Toast.Style.Success, title: "UDP Sent", message: json })
    })
  }

  return (
    <List navigationTitle={`Options for ${title}`}>
      {options.map((opt) => (
        <List.Item
          key={opt}
          title={opt}
          icon={opt === 'Turn on' ? Icon.LightBulb : Icon.Moon}
          actions={
            <ActionPanel>
              <Action
                title={`Send "${opt}" Command`}
                onAction={() => sendUDPCommand(opt)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  )
}
