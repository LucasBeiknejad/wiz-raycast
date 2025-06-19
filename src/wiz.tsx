import {
  ActionPanel,
  Action,
  Icon,
  List,
  useNavigation,
  showToast,
  Toast,
  Form
} from "@raycast/api"
import { useState } from "react"
import { exec } from "child_process"

const options = ['Turn on', 'Turn off']

export default function Command() {
  return <LightsList />
}

function LightsList() {
  const { push } = useNavigation()
  const [lights, setLights] = useState([
    { name: "Living room", ip: "192.168.1.248" },
    { name: "Closet", ip: "192.168.1.37" }
  ])
  const [savedColors, setSavedColors] = useState([
    { name: 'Sunset', hex: '#FF5733' },
    { name: 'Ocean', hex: '#1E90FF' }
  ])

  function handleAddLight(newLight) {
    setLights([...lights, newLight])
  }

  function handleDeleteLight(ip) {
    setLights(prev => prev.filter(light => light.ip !== ip))
  }

  function handleAddColor(color) {
    setSavedColors([...savedColors, color])
  }

  return (
    <List>
      {lights.map((light) => (
        <List.Item
          key={light.name}
          icon={light.name === 'Living room' ? Icon.LightBulb : Icon.Goal}
          title={light.name}
          subtitle={light.ip}
          accessories={[{ icon: Icon.Network, text: light.ip }]}
          actions={
            <ActionPanel>
              <Action
                title="Show Options"
                onAction={() =>
                  push(
                    <LightOptions
                      name={light.name}
                      ip={light.ip}
                      colors={savedColors}
                      onAddColor={handleAddColor}
                      onDeleteLight={() => handleDeleteLight(light.ip)}
                    />
                  )
                }
              />
            </ActionPanel>
          }
        />
      ))}

      <List.Item
        title="Add New Light"
        icon={Icon.Plus}
        actions={
          <ActionPanel>
            <Action title="Add Light" onAction={() => push(<AddLightForm onSubmit={handleAddLight} />)} />
          </ActionPanel>
        }
      />
    </List>
  )
}

function LightOptions({ name, ip, colors, onAddColor, onDeleteLight }) {
  const { push, pop } = useNavigation()

  function sendUDPCommand(json) {
    const cmd = `echo '${JSON.stringify(json)}' | nc -u -w 1 ${ip} 38899`

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        showToast({ style: Toast.Style.Failure, title: "UDP Failed", message: stderr })
        return
      }
      showToast({ style: Toast.Style.Success, title: `Command sent to ${name}` })
    })
  }

  function hexToRGB(hex) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  // This function turns on the light and sets a color (default white)
  function turnOnWithColor(color = { r: 255, g: 255, b: 255 }) {
    sendUDPCommand({
      id: 1,
      method: 'setState',
      params: { state: true }
    })

    setTimeout(() => {
      sendUDPCommand({
        id: 1,
        method: 'setPilot',
        params: color
      })
    }, 300)
  }

  function sendColorCommand(hex) {
    const rgb = hexToRGB(hex)
    turnOnWithColor(rgb)
  }

  function handleDelete() {
    showToast({ style: Toast.Style.Success, title: "Light Deleted", message: name })
    pop()
    onDeleteLight()
  }

  return (
    <List navigationTitle={`Options for ${name}`}>
      {options.map((opt) => (
        <List.Item
          key={opt}
          title={opt}
          icon={opt === 'Turn on' ? Icon.Sun : Icon.Moon}
          actions={
            <ActionPanel>
              <Action
                title={`Send "${opt}" Command`}
                onAction={() => {
                  if (opt === 'Turn on') {
                    turnOnWithColor()
                  } else {
                    sendUDPCommand({
                      id: 1,
                      method: 'setState',
                      params: { state: false }
                    })
                  }
                }}
              />
            </ActionPanel>
          }
        />
      ))}

      {colors.map((color) => (
        <List.Item
          key={color.hex}
          title={color.name}
          subtitle={color.hex}
          icon={{ source: Icon.Circle, tintColor: color.hex }}
          actions={
            <ActionPanel>
              <Action title={`Apply ${color.name}`} onAction={() => sendColorCommand(color.hex)} />
            </ActionPanel>
          }
        />
      ))}

      <List.Item
        title="Add New Color"
        icon={Icon.Plus}
        actions={
          <ActionPanel>
            <Action title="Add Color" onAction={() => push(<AddColorForm onSubmit={onAddColor} />)} />
          </ActionPanel>
        }
      />

      <List.Item
        title="Delete This Light"
        icon={Icon.Trash}
        actions={
          <ActionPanel>
            <Action
              title="Delete"
              style={Action.Style.Destructive}
              icon={Icon.Trash}
              onAction={handleDelete}
            />
          </ActionPanel>
        }
      />
    </List>
  )
}

function AddLightForm({ onSubmit }) {
  const { pop } = useNavigation()

  function handleSubmit(values) {
    const newLight = {
      name: values.name,
      ip: values.ip
    }
    onSubmit(newLight)
    pop()
    showToast({ style: Toast.Style.Success, title: "Light Added", message: values.name })
  }

  return (
    <Form
      navigationTitle="Add New Light"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add Light" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Light Name" placeholder="e.g. Bedroom" />
      <Form.TextField id="ip" title="IP Address" placeholder="e.g. 192.168.1.42" />
    </Form>
  )
}

function AddColorForm({ onSubmit }) {
  const { pop } = useNavigation()

  function handleSubmit(values) {
    const newColor = {
      name: values.name,
      hex: values.hex.startsWith('#') ? values.hex : `#${values.hex}`
    }
    onSubmit(newColor)
    pop()
    showToast({ style: Toast.Style.Success, title: "Color Added", message: newColor.name })
  }

  return (
    <Form
      navigationTitle="Add New Color"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Color" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Color Name" placeholder="e.g. Sunset" />
      <Form.TextField id="hex" title="Hex Code" placeholder="#FF0000" />
    </Form>
  )
}
